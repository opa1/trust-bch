import { ERROR_MESSAGES, ErrorCode, ErrorDefinition } from "./errorCodes";

/**
 * Custom application error class
 * Provides typed error codes with automatic message/action mapping
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly action?: string;
  public readonly metadata?: Record<string, any>;
  public readonly isOperational: boolean = true;

  /**
   * Create a new AppError
   *
   * @param code - Error code from ErrorCode enum
   * @param metadata - Optional metadata for logging (never sent to client)
   */
  constructor(code: ErrorCode, metadata?: Record<string, any>) {
    const errorDef: ErrorDefinition = ERROR_MESSAGES[code];

    // Determine message: favour metadata.message if provided, otherwise default
    let message = errorDef.message;
    if (metadata && metadata.message) {
      message = metadata.message;
    }

    // Call parent Error constructor with user-friendly message
    super(message);

    this.code = code;
    this.statusCode = errorDef.statusCode;
    this.action = errorDef.action;
    this.metadata = metadata;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON format safe for client
   * Never includes stack trace or metadata
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      action: this.action,
    };
  }

  /**
   * Get full error details for logging
   * Includes all information including metadata
   */
  toLogFormat() {
    return {
      code: this.code,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}
