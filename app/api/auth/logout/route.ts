import { handleError, successResponse } from "@/lib/utils/responses";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
export async function POST(req: NextRequest) {
  try {
    const response = successResponse(null, "Logged out successfully");

    // Clear the auth cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
