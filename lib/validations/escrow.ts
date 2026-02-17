import { z } from "zod";

export const createEscrowSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .trim(),
  amountBCH: z
    .number()
    .positive("Amount must be greater than 0")
    .min(0.00001, "Amount must be at least 0.00001 BCH")
    .max(21000000, "Amount exceeds maximum BCH supply"),
  sellerEmail: z.string().email("Invalid email address").toLowerCase().trim(),
  expiryHours: z
    .number()
    .int("Expiry hours must be an integer")
    .min(1, "Expiry must be at least 1 hour")
    .max(720, "Expiry cannot exceed 30 days")
    .optional(),
});

export const startEscrowWorkSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
});

export const submitEscrowWorkSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  description: z.string().optional(),
});

export const updateEscrowSchema = z.object({
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(100, "Description must be less than 100 characters"),
  amountBCH: z.coerce
    .number()
    .min(0.00001, "Amount must be at least 0.00001 BCH")
    .max(21000000, "Amount exceeds maximum BCH supply")
    .optional(),
});

export type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;
export type UpdateEscrowFormData = z.infer<typeof updateEscrowSchema>;
