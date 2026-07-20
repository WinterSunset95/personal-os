import { z } from "zod";
import { projectStatuses } from "@/domain/project/types";
import { priorities } from "@/domain/task/types";
import { optionalText, optionalDate } from "@/domain/shared/validation";

export { optionalText, optionalDate };

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120),
  description: optionalText,
  status: z.enum(projectStatuses),
  priority: z.enum(priorities),
  dueDate: optionalDate,
});
