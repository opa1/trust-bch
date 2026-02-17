import { z } from "zod";

export const applyAsAgentSchema = z.object({
  bio: z.string().min(50, {
    message: "Bio must be at least 50 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid contact email.",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the agent terms and conditions.",
  }),
});

export type ApplyAsAgentFormData = z.infer<typeof applyAsAgentSchema>;
