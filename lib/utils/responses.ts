import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { logError } from "@/lib/utils/logger";

/**
 * Standard API success response structure
 */
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Creates a standardized success response
 *
 * @param data - Response data payload
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status },
  );
}

/**
 * Creates a standardized error response
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code
 * @param details - Optional additional error details
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: any,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status },
  );
}

/**
 * Handles Zod validation errors and returns formatted response
 *
 * @param error - Zod validation error
 * @returns NextResponse with validation error details
 */
export function validationErrorResponse(
  error: z.ZodError,
): NextResponse<ErrorResponse> {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return errorResponse(
    "Validation failed",
    400,
    "VALIDATION_ERROR",
    formattedErrors,
  );
}

/**
 * Handles general errors and returns appropriate response
 *
 * @param error - Error object
 * @returns NextResponse with error details
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  // Log full error details internally
  logError(error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.action ? { action: error.action } : undefined,
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof z.ZodError) {
    return validationErrorResponse(error);
  }

  if (error instanceof Error) {
    // Handle Prisma Connection Errors
    // @ts-ignore - Prisma errors might not be fully typed here without importing the class
    const prismaError = error as any;
    if (
      prismaError.code === "P1001" ||
      error.message.includes("Can't reach database server")
    ) {
      return errorResponse(
        "Database is currently unavailable. Please try again later.",
        503,
        "DB_CONNECTION_ERROR",
      );
    }

    // @ts-ignore
    if (prismaError.code === "P1002" || error.message.includes("timed out")) {
      return errorResponse(
        "Database request timed out. Please try again.",
        504,
        "DB_TIMEOUT_ERROR",
      );
    }

    // Check for common error patterns
    if (error.message.includes("duplicate key")) {
      return errorResponse("Resource already exists", 409, "DUPLICATE_ERROR");
    }

    if (error.message.includes("not found")) {
      return errorResponse("Resource not found", 404, "NOT_FOUND");
    }

    // Handle authentication errors that might not be AppErrors yet
    if (
      error.message.toLowerCase().includes("unauthorized") ||
      error.message.toLowerCase().includes("token") ||
      error.message.toLowerCase().includes("jwt")
    ) {
      return errorResponse(
        "You must be logged in to perform this action.",
        401,
        "UNAUTHORIZED",
      );
    }

    // Default to internal error for unhandled exceptions to avoid leaking details
    return errorResponse(
      "An unexpected error occurred.",
      500,
      "INTERNAL_ERROR",
      process.env.NODE_ENV === "development"
        ? { originalError: error.message }
        : undefined,
    );
  }

  return errorResponse("An unexpected error occurred", 500, "UNKNOWN_ERROR");
}
