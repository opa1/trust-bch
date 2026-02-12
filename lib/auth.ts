import { verifyToken } from "@/lib/utils/jwt";
import { NextRequest } from "next/server";

/**
 * Authentication result interface
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Verify authentication from HTTP-only cookie
 * Extracts and verifies JWT token from auth_token cookie
 *
 * @param req - Next.js request object
 * @returns Authentication result with user info if valid
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return {
        authenticated: false,
        error: "No authentication token",
      };
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return {
        authenticated: false,
        error: "Invalid or expired token",
      };
    }

    return {
      authenticated: true,
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
