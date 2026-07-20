"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskRepository } from "@/repositories/task.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { taskQuerySchema } from "./task-query";

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

async function ensureProject(projectId: string | null) {
  if (!projectId) return;
  const project = await ProjectRepository.findActiveById(projectId);
  if (!project) throw new Error("Project views require an active project.");
}

export async function createTaskView(input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  await ensureProject(value.projectId);
  const view = await TaskRepository.createView(value);
  refresh(value.projectId);
  return view.id;
}

export async function updateTaskView(viewId: string, input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  const existing = await TaskRepository.findViewFirst(viewId);
  if (!existing) throw new Error("Saved view is unavailable.");
  if (existing.projectId !== value.projectId) throw new Error("Saved view scope cannot be changed.");
  await ensureProject(value.projectId);
  await TaskRepository.updateView(viewId, { name: value.name, query: value.query });
  refresh(value.projectId);
}

export async function deleteTaskView(viewId: string) {
  const existing = await TaskRepository.findViewFirst(viewId);
  if (!existing) return;
  await TaskRepository.deleteView(viewId);
  refresh(existing.projectId);
}
