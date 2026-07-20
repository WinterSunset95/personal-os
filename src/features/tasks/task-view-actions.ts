"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskService } from "@/services/task.service";
import { taskQuerySchema } from "@/domain/task/query";

const taskViewInput = z.object({
  name: z.string().trim().min(1, "View name is required.").max(60),
  projectId: z.string().uuid().nullable(),
  query: taskQuerySchema,
});

function refresh(projectId?: string | null) {
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskView(input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  const view = await TaskService.createTaskView(value);
  refresh(value.projectId);
  return view.id;
}

export async function updateTaskView(viewId: string, input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  await TaskService.updateTaskView(viewId, value);
  refresh(value.projectId);
}

export async function deleteTaskView(viewId: string) {
  const projectId = await TaskService.deleteTaskView(viewId);
  refresh(projectId);
}
