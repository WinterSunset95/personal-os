"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-utils";
import { TaskViewService } from "@/services/task-view.service";
import { taskViewInputSchema } from "@/domain/task/views";

function refresh(projectId?: string | null) {
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskView(
  input: z.input<typeof taskViewInputSchema>,
) {
  const userId = await requireUserId();
  const view = await TaskViewService.createTaskView(userId, input);
  refresh(view.projectId);
  return view.id;
}

export async function updateTaskView(
  viewId: string,
  input: z.input<typeof taskViewInputSchema>,
) {
  const userId = await requireUserId();
  const result = await TaskViewService.updateTaskView(userId, viewId, input);
  refresh(result.projectId);
}

export async function deleteTaskView(viewId: string) {
  const userId = await requireUserId();
  const projectId = await TaskViewService.deleteTaskView(userId, viewId);
  refresh(projectId);
}
