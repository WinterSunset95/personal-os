"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskService } from "@/services/task.service";
import { taskViewInputSchema } from "@/domain/task/views";

function refresh(projectId?: string | null) {
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskView(input: z.input<typeof taskViewInputSchema>) {
  const view = await TaskService.createTaskView(input);
  refresh(view.projectId);
  return view.id;
}

export async function updateTaskView(viewId: string, input: z.input<typeof taskViewInputSchema>) {
  const result = await TaskService.updateTaskView(viewId, input);
  refresh(result.projectId);
}

export async function deleteTaskView(viewId: string) {
  const projectId = await TaskService.deleteTaskView(viewId);
  refresh(projectId);
}
