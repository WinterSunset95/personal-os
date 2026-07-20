"use server";

import { z } from "zod";
import { ProjectService } from "@/services/project.service";
import { TaskService } from "@/services/task.service";
import { AttachmentService } from "@/services/attachment.service";
import { projectInputSchema } from "@/domain/project/validation";
import { taskInputSchema } from "@/domain/task/validation";

const colorInput = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const tagInput = z.object({ name: z.string().trim().min(1).max(40), color: colorInput, projectId: z.string().uuid().nullable() });

export async function createProject(input: z.input<typeof projectInputSchema>) {
  return ProjectService.createProject(input);
}

export async function updateProject(projectId: string, input: z.input<typeof projectInputSchema>) {
  return ProjectService.updateProject(projectId, input);
}

export async function archiveProject(projectId: string) {
  return ProjectService.archiveProject(projectId);
}

export async function quickCaptureTask(title: string, projectId?: string) {
  return TaskService.quickCaptureTask(title, projectId);
}

export async function restoreProject(projectId: string) {
  return ProjectService.restoreProject(projectId);
}

export async function createTask(input: z.input<typeof taskInputSchema>) {
  return TaskService.createTask(input);
}

export async function updateTask(taskId: string, input: z.input<typeof taskInputSchema>) {
  return TaskService.updateTask(taskId, input);
}

export async function toggleTaskCompletion(taskId: string, projectId: string, completed: boolean) {
  return TaskService.toggleTaskCompletion(taskId, projectId, completed);
}

export async function archiveTask(taskId: string, projectId: string) {
  return TaskService.archiveTask(taskId, projectId);
}

export async function restoreTask(taskId: string, projectId: string) {
  return TaskService.restoreTask(taskId, projectId);
}

export async function removeTaskAttachment(attachmentId: string, projectId: string) {
  return AttachmentService.removeAttachment(attachmentId, projectId);
}

export async function createTag(input: z.input<typeof tagInput>) {
  return TaskService.createTag(input);
}

export async function updateTag(tagId: string, input: z.input<typeof tagInput>) {
  return TaskService.updateTag(tagId, input);
}

export async function deleteTag(tagId: string) {
  return TaskService.deleteTag(tagId);
}

export async function setTaskTags(taskId: string, projectId: string, tagIds: string[]) {
  return TaskService.setTaskTags(taskId, projectId, tagIds);
}

export async function updateTaskProperty(taskId: string, projectId: string, property: "status" | "priority" | "dueDate" | "focusDate", value: string) {
  return TaskService.updateTaskProperty(taskId, projectId, property, value);
}

export async function updatePropertyColor(property: "status" | "priority", value: string, color: string) {
  return TaskService.updatePropertyColor(property, value, color);
}

export async function duplicateTask(taskId: string, projectId: string) {
  return TaskService.duplicateTask(taskId, projectId);
}
