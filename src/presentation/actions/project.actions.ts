"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

export async function createProject(input: z.input<typeof projectInputSchema>): Promise<string> {
  const projectId = await ProjectService.createProject(input);
  refresh(projectId);
  return projectId;
}

export async function updateProject(projectId: string, input: z.input<typeof projectInputSchema>): Promise<void> {
  await ProjectService.updateProject(projectId, input);
  refresh(projectId);
}

export async function archiveProject(projectId: string): Promise<void> {
  await ProjectService.archiveProject(projectId);
  refresh(projectId);
}

export async function quickCaptureTask(title: string, projectId?: string): Promise<void> {
  const result = await TaskService.quickCaptureTask(title, projectId);
  refresh(result.projectId);
}

export async function restoreProject(projectId: string): Promise<void> {
  await ProjectService.restoreProject(projectId);
  refresh(projectId);
}

export async function createTask(input: z.input<typeof taskInputSchema>): Promise<void> {
  const result = await TaskService.createTask(input);
  refresh(result.projectId);
}

export async function updateTask(taskId: string, input: z.input<typeof taskInputSchema>): Promise<void> {
  const result = await TaskService.updateTask(taskId, input);
  refresh(result.projectId);
}

export async function toggleTaskCompletion(taskId: string, projectId: string, completed: boolean): Promise<void> {
  await TaskService.toggleTaskCompletion(taskId, projectId, completed);
  refresh(projectId);
}

export async function archiveTask(taskId: string, projectId: string): Promise<void> {
  await TaskService.archiveTask(taskId, projectId);
  refresh(projectId);
}

export async function restoreTask(taskId: string, projectId: string): Promise<void> {
  await TaskService.restoreTask(taskId, projectId);
  refresh(projectId);
}

export async function removeTaskAttachment(attachmentId: string, projectId: string): Promise<void> {
  await AttachmentService.removeAttachment(attachmentId, projectId);
  refresh(projectId);
}

export async function createTag(input: z.input<typeof tagInputSchema>): Promise<void> {
  const tag = await TagService.createTag(input);
  refresh(tag.projectId ?? undefined);
}

export async function updateTag(tagId: string, input: z.input<typeof tagInputSchema>): Promise<void> {
  await TagService.updateTag(tagId, input);
  const value = tagInputSchema.parse(input);
  refresh(value.projectId ?? undefined);
}

export async function deleteTag(tagId: string): Promise<void> {
  const projectId = await TagService.deleteTag(tagId);
  refresh(projectId ?? undefined);
}

export async function setTaskTags(taskId: string, projectId: string, tagIds: string[]): Promise<void> {
  await TagService.setTaskTags(taskId, projectId, tagIds);
  refresh(projectId);
}

export async function updateTaskProperty(taskId: string, projectId: string, property: "status" | "priority" | "dueDate" | "focusDate", value: string): Promise<void> {
  await TaskService.updateTaskProperty(taskId, projectId, property, value);
  refresh(projectId);
}

export async function updatePropertyColor(property: "status" | "priority", value: string, color: string): Promise<void> {
  await TaskService.updatePropertyColor(property, value, color);
  refresh();
}

export async function duplicateTask(taskId: string, projectId: string): Promise<void> {
  await TaskService.duplicateTask(taskId, projectId);
  refresh(projectId);
}

export async function searchTasks(term: string) {
  return TaskService.searchTasks(term);
}
