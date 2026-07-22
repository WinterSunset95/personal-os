import { z } from "zod";

export const colorInputSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const tagInputSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required.").max(40),
  color: colorInputSchema,
  projectId: z.string().uuid().nullable(),
});
