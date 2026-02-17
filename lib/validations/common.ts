import { z } from "zod";

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

export type EscrowIdInput = z.infer<typeof escrowIdSchema>;
export type TxIdInput = z.infer<typeof txIdSchema>;
export type BchAddressInput = z.infer<typeof bchAddressSchema>;
