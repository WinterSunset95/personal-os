import { z } from "zod";
import { taskStatuses, priorities } from "@/domain/task/types";
import { optionalText, optionalDate } from "@/domain/shared/validation";

export const taskInputSchema = z.object({
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().nullable(),
  title: z.string().trim().min(1, "Task title is required.").max(160),
  description: optionalText,
  status: z.enum(taskStatuses),
  priority: z.enum(priorities),
  dueDate: optionalDate,
  focusDate: optionalDate,
});
