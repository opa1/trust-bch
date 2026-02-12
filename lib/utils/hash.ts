import bcrypt from "bcryptjs";

/**
 * Number of salt rounds for bcrypt hashing
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain text password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
}

/**
 * Compares a plain text password with a hashed password
 *
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
}
