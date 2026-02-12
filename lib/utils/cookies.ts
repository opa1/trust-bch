import { NextResponse } from "next/server";
import { generateToken, TokenPayload } from "./jwt";

/**
 * Set authentication token cookie on a NextResponse
 * Configures httpOnly cookie with appropriate security settings
 *
 * @param response - NextResponse object to set cookie on
 * @param user - User object to generate token for
 */
export function setAuthCookie(
  response: NextResponse,
  user: { id: string; email: string },
): void {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const token = generateToken(payload);

  console.log("This is the token: ", token);

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}
