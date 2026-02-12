import { z } from "zod";

/**
 * Validation schema for user registration
 */
export const signupSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters")
    .trim(),
});

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * Validation schema for creating an escrow
 */
export const createEscrowSchema = z.object({
  receiverEmail: z
    .string()
    .email("Invalid receiver email address")
    .toLowerCase()
    .trim(),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount exceeds maximum limit"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .trim(),
  expiryHours: z
    .number()
    .int("Expiry hours must be an integer")
    .min(1, "Expiry must be at least 1 hour")
    .max(720, "Expiry cannot exceed 30 days")
    .optional(),
});

/**
 * Validation schema for escrow status check
 */
export const escrowIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid escrow ID format"),
});

/**
 * Validation schema for BCH transaction ID
 */
export const txIdSchema = z.object({
  txId: z.string().regex(/^[0-9a-fA-F]{64}$/, "Invalid transaction ID format"),
});

/**
 * Validation schema for BCH address
 */
export const bchAddressSchema = z.object({
  address: z
    .string()
    .regex(
      /^(bitcoincash:|bchtest:)?[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42}$/,
      "Invalid BCH address format",
    ),
});

/**
 * Type inference helpers
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type EscrowIdInput = z.infer<typeof escrowIdSchema>;
export type TxIdInput = z.infer<typeof txIdSchema>;
export type BchAddressInput = z.infer<typeof bchAddressSchema>;
