import { handleError, successResponse } from "@/lib/utils/responses";
import { loginSchema } from "@/lib/utils/validators";
import { setAuthCookie } from "@/lib/utils/cookies";
import { loginUser } from "@/services/auth.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/login
 * Authenticate user and set JWT in HTTP-only cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Login user
    const result = await loginUser(validatedData.email, validatedData.password);

    // Create response with user data (no token in body)
    const response = successResponse(
      {
        user: result.user,
      },
      "Login successful",
    );

    // Set JWT in HTTP-only cookie
    setAuthCookie(response, result.user);

    return response;
  } catch (error) {
    return handleError(error);
  }
}
