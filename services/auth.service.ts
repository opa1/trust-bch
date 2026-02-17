import { AppError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/utils/id";
import { User } from "@prisma/client";

import { comparePassword, hashPassword } from "@/lib/utils/hash";
import { generateToken, TokenPayload } from "@/lib/utils/jwt";
import { generateEncryptedWallet } from "@/server/blockchain/wallet";

/**
 * User registration result
 */
export interface RegisterResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
  };
  token: string;
}

/**
 * User login result
 */
export interface LoginResult {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  token: string;
}

/**
 * Registers a new user
 *
 * @param email - User email address
 * @param password - Plain text password
 * @param fullName - User full name
 * @returns Registration result with user data and JWT token
 * @throws Error if email already exists
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
): Promise<RegisterResult> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    throw new AppError("EMAIL_IN_USE", { email });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate user wallet
  const wallet = generateEncryptedWallet();

  // Create user
  const user = await prisma.user.create({
    data: {
      id: generateId(),
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      // Create user wallet
      walletAddress: wallet.address,
      walletPublicKey: wallet.publicKey,
      privateKeyEncrypted: wallet.encryptedPrivateKey,
    },
  });

  // Generate JWT token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };
  const token = generateToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Authenticates a user with email and password
 *
 * @param email - User email address
 * @param password - Plain text password
 * @returns Login result with user data and JWT token
 * @throws Error if credentials are invalid
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError("INVALID_CREDENTIALS");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("INVALID_CREDENTIALS");
  }

  // Generate JWT token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };
  const token = generateToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    token,
  };
}

/**
 * Gets user by ID
 *
 * @param userId - User ID
 * @returns User data or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

/**
 * Gets user by email
 *
 * @param email - User email address
 * @returns User data or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return user;
}

/**
 * Updates a user's profile
 *
 * @param userId - User ID
 * @param data - Data to update
 * @returns Updated user data
 */
export async function updateUser(
  userId: string,
  data: { fullName?: string; email?: string; password?: string },
): Promise<User> {
  const updateData: any = {};

  if (data.fullName) {
    updateData.fullName = data.fullName;
  }

  if (data.email) {
    // Check if email is taken by another user
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing && existing.id !== userId) {
      throw new AppError("EMAIL_IN_USE", { email: data.email });
    }
    updateData.email = data.email.toLowerCase();
  }

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return user;
}

/**
 * Searches for users by name or email
 *
 * @param query - Search query
 * @param limit - Max results (default 10)
 * @returns Array of users (partial details)
 */
export async function searchUsers(
  query: string,
  limit: number = 10,
): Promise<Partial<User>[]> {
  if (!query || query.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { successRate: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      successRate: true,
      totalEscrows: true,
      createdAt: true,
      walletAddress: true, // Needed for frontend validation/display if we want
    },
  });

  return users as unknown as Partial<User>[];
}
