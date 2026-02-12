import { verifyAuth } from "@/lib/auth";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/utils/responses";
import { getUserById } from "@/services/auth.service";
import { NextRequest } from "next/server";

/**
 * GET /api/auth/me
 * Get current authenticated user from HTTP-only cookie
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication from cookie
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Get user data
    const user = await getUserById(authResult.userId);

    if (!user) {
      return errorResponse("User not found", 404, "NOT_FOUND");
    }

    // Return user data without sensitive fields
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication from cookie
    const authResult = await verifyAuth(req);

    if (!authResult.authenticated || !authResult.userId) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const { fullName, email, password } = body;

    // Validate input (basic validation)
    if (!fullName && !email && !password) {
      return errorResponse("No data provided to update", 400, "BAD_REQUEST");
    }

    // Update user
    const { updateUser } = await import("@/services/auth.service");
    const updatedUser = await updateUser(authResult.userId, {
      fullName,
      email,
      password,
    });

    return successResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
