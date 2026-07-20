import { z } from "zod";
import { projectStatuses } from "@/domain/project/types";
import { priorities } from "@/domain/task/types";

export const optionalText = z.string().trim().max(2_000).optional().transform((value) => value || null);
export const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((value) => value || null);

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120),
  description: optionalText,
  status: z.enum(projectStatuses),
  priority: z.enum(priorities),
  dueDate: optionalDate,
});
