import { handleError, successResponse } from "@/lib/utils/responses";
import { signupSchema } from "@/lib/validations/auth";
import { setAuthCookie } from "@/lib/utils/cookies";
import { registerUser } from "@/services/auth.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/register
 * Register a new user and set JWT in HTTP-only cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = signupSchema.parse(body);

    // Register user
    const result = await registerUser(
      validatedData.email,
      validatedData.password,
      validatedData.fullName,
    );

    // Create response with user data (no token in body)
    const response = successResponse(
      {
        user: result.user,
      },
      "User registered successfully",
      201,
    );

    // Set JWT in HTTP-only cookie
    setAuthCookie(response, result.user);

    return response;
  } catch (error) {
    return handleError(error);
  }
}
