import { z } from "zod";

export const createDisputeSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  reason: z.string().min(1, "Reason is required"),
  description: z
    .string()
    .min(20, "Please provide more details (at least 20 chars)"),
});

export type CreateDisputeFormData = z.infer<typeof createDisputeSchema>;

export const addEvidenceSchema = z.object({
  content: z.string().min(1, "Evidence content is required"),
  type: z.enum(["text", "image", "file"]).default("text"),
});
