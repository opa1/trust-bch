import { z } from "zod";

export const createEscrowSchema = z.object({
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(100, "Description must be less than 100 characters"),
  amountBCH: z
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0.00001, "Amount must be at least 0.00001 BCH")
    .max(21000000, "Amount exceeds maximum BCH supply"),
  sellerEmail: z.string().email("Invalid email address"),
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
