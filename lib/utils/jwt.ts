import jwt from "jsonwebtoken";

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Decoded JWT token with standard claims
 */
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generates a JWT token for authenticated user
 *
 * @param payload - Token payload containing user information
 * @returns Signed JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn: string | number = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret || typeof secret !== "string") {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  // @ts-expect-error - TypeScript has trouble narrowing process.env types
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
}

/**
 * Verifies and decodes a JWT token
 *
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): DecodedToken {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== "string") {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
}

/**
 * Extracts JWT token from Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return token;
}
