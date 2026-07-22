"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-utils";
import { ProjectService } from "@/services/project.service";
import { TaskService } from "@/services/task.service";
import { TagService } from "@/services/tag.service";
import { AttachmentService } from "@/services/attachment.service";
import { projectInputSchema } from "@/domain/project/validation";
import { taskInputSchema } from "@/domain/task/validation";
import { tagInputSchema } from "@/domain/tag/validation";

function refresh(projectId?: string | null) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/archive");
  revalidatePath("/documents");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createProject(
  input: z.input<typeof projectInputSchema>,
): Promise<string> {
  const userId = await requireUserId();
  const projectId = await ProjectService.createProject(userId, input);
  refresh(projectId);
  return projectId;
}

export async function updateProject(
  projectId: string,
  input: z.input<typeof projectInputSchema>,
): Promise<void> {
  const userId = await requireUserId();
  await ProjectService.updateProject(userId, projectId, input);
  refresh(projectId);
}

export async function archiveProject(projectId: string): Promise<void> {
  const userId = await requireUserId();
  await ProjectService.archiveProject(userId, projectId);
  refresh(projectId);
}

export async function quickCaptureTask(
  title: string,
  projectId?: string,
): Promise<void> {
  const userId = await requireUserId();
  const result = await TaskService.quickCaptureTask(userId, title, projectId);
  refresh(result.projectId);
}

export async function restoreProject(projectId: string): Promise<void> {
  const userId = await requireUserId();
  await ProjectService.restoreProject(userId, projectId);
  refresh(projectId);
}

export async function createTask(
  input: z.input<typeof taskInputSchema>,
): Promise<void> {
  const userId = await requireUserId();
  const result = await TaskService.createTask(userId, input);
  refresh(result.projectId);
}

export async function updateTask(
  taskId: string,
  input: z.input<typeof taskInputSchema>,
): Promise<void> {
  const userId = await requireUserId();
  const result = await TaskService.updateTask(userId, taskId, input);
  refresh(result.projectId);
}

export async function toggleTaskCompletion(
  taskId: string,
  projectId: string,
  completed: boolean,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.toggleTaskCompletion(userId, taskId, projectId, completed);
  refresh(projectId);
}

export async function archiveTask(
  taskId: string,
  projectId: string,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.archiveTask(userId, taskId, projectId);
  refresh(projectId);
}

export async function restoreTask(
  taskId: string,
  projectId: string,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.restoreTask(userId, taskId, projectId);
  refresh(projectId);
}

export async function removeTaskAttachment(
  attachmentId: string,
  projectId: string,
): Promise<void> {
  const userId = await requireUserId();
  await AttachmentService.removeAttachment(attachmentId, projectId, userId);
  refresh(projectId);
}

export async function createTag(
  input: z.input<typeof tagInputSchema>,
): Promise<void> {
  const userId = await requireUserId();
  const tag = await TagService.createTag(userId, input);
  refresh(tag.projectId ?? undefined);
}

export async function updateTag(
  tagId: string,
  input: z.input<typeof tagInputSchema>,
): Promise<void> {
  const userId = await requireUserId();
  await TagService.updateTag(userId, tagId, input);
  const value = tagInputSchema.parse(input);
  refresh(value.projectId ?? undefined);
}

export async function deleteTag(tagId: string): Promise<void> {
  const userId = await requireUserId();
  const projectId = await TagService.deleteTag(userId, tagId);
  refresh(projectId ?? undefined);
}

export async function setTaskTags(
  taskId: string,
  projectId: string,
  tagIds: string[],
): Promise<void> {
  const userId = await requireUserId();
  await TagService.setTaskTags(userId, taskId, projectId, tagIds);
  refresh(projectId);
}

export async function updateTaskProperty(
  taskId: string,
  projectId: string,
  property: "status" | "priority" | "dueDate" | "focusDate",
  value: string,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.updateTaskProperty(userId, taskId, projectId, property, value);
  refresh(projectId);
}

export async function updatePropertyColor(
  property: "status" | "priority",
  value: string,
  color: string,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.updatePropertyColor(userId, property, value, color);
  refresh();
}

export async function duplicateTask(
  taskId: string,
  projectId: string,
): Promise<void> {
  const userId = await requireUserId();
  await TaskService.duplicateTask(userId, taskId, projectId);
  refresh(projectId);
}

export async function searchTasks(term: string) {
  const userId = await requireUserId();
  return TaskService.searchTasks(userId, term);
}
