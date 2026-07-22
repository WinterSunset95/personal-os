import { z } from "zod";

export const optionalText = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .transform((value) => value || null);
export const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);
