"use server";

import { and, eq, inArray, isNull, max } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { projects, taskAttachments, tasks } from "@/db/schema";
import { descendantIds, type TaskRecord } from "@/features/tasks/tree";
import { priorities, projectStatuses, taskStatuses } from "@/types/domain";

const optionalText = z.string().trim().max(2_000).optional().transform((value) => value || null);
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((value) => value || null);
const projectInput = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120), description: optionalText,
  status: z.enum(projectStatuses), priority: z.enum(priorities), dueDate: optionalDate,
});
const taskInput = z.object({
  projectId: z.string().uuid(), parentTaskId: z.string().uuid().nullable(), title: z.string().trim().min(1, "Task title is required.").max(160),
  description: optionalText, status: z.enum(taskStatuses), priority: z.enum(priorities), dueDate: optionalDate, focusDate: optionalDate,
});

function refresh(projectId?: string) {
  revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/archive"); revalidatePath("/documents");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createProject(input: z.input<typeof projectInput>) {
  const value = projectInput.parse(input);
  const [project] = await db.insert(projects).values(value).returning();
  refresh(project.id);
  return project.id;
}

export async function updateProject(projectId: string, input: z.input<typeof projectInput>) {
  const value = projectInput.parse(input);
  await db.update(projects).set({ ...value, updatedAt: new Date() }).where(and(eq(projects.id, projectId), isNull(projects.archivedAt)));
  refresh(projectId);
}

export async function archiveProject(projectId: string) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (project?.isSystemInbox) throw new Error("The System Inbox cannot be archived.");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(projects).set({ archivedAt: now, updatedAt: now }).where(eq(projects.id, projectId));
    await tx.update(tasks).set({ archivedAt: now, updatedAt: now }).where(eq(tasks.projectId, projectId));
  });
  refresh(projectId);
}

async function getOrCreateInbox() {
  const existing = await db.query.projects.findFirst({ where: eq(projects.isSystemInbox, true) });
  if (existing) return existing;
  const [inbox] = await db.insert(projects).values({ name: "Inbox", description: "Quickly captured tasks.", status: "active", priority: "none", isSystemInbox: true }).returning();
  return inbox;
}

export async function quickCaptureTask(title: string, projectId?: string) {
  const trimmedTitle = z.string().trim().min(1, "Task title is required.").max(160).parse(title);
  const project = projectId
    ? await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), isNull(projects.archivedAt)) })
    : await getOrCreateInbox();
  if (!project) throw new Error("The selected project is unavailable.");
  const [last] = await db.select({ last: max(tasks.order) }).from(tasks).where(and(eq(tasks.projectId, project.id), isNull(tasks.parentTaskId)));
  await db.insert(tasks).values({ projectId: project.id, title: trimmedTitle, status: "todo", priority: "none", order: (last?.last ?? 0) + 1 });
  refresh(project.id);
}

export async function restoreProject(projectId: string) {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(projects).set({ archivedAt: null, updatedAt: now }).where(eq(projects.id, projectId));
    await tx.update(tasks).set({ archivedAt: null, updatedAt: now }).where(eq(tasks.projectId, projectId));
  });
  refresh(projectId);
}

export async function createTask(input: z.input<typeof taskInput>) {
  const value = taskInput.parse(input);
  const project = await db.query.projects.findFirst({ where: and(eq(projects.id, value.projectId), isNull(projects.archivedAt)) });
  if (!project) throw new Error("The project is unavailable.");
  if (value.parentTaskId) {
    const parent = await db.query.tasks.findFirst({ where: and(eq(tasks.id, value.parentTaskId), eq(tasks.projectId, value.projectId), isNull(tasks.archivedAt)) });
    if (!parent) throw new Error("A subtask must belong to an active task in the same project.");
  }
  const [last] = await db.select({ last: max(tasks.order) }).from(tasks).where(and(eq(tasks.projectId, value.projectId), value.parentTaskId ? eq(tasks.parentTaskId, value.parentTaskId) : isNull(tasks.parentTaskId)));
  await db.insert(tasks).values({ ...value, order: (last?.last ?? 0) + 1 });
  refresh(value.projectId);
}

export async function updateTask(taskId: string, input: z.input<typeof taskInput>) {
  const value = taskInput.parse(input);
  const task = await db.query.tasks.findFirst({ where: and(eq(tasks.id, taskId), eq(tasks.projectId, value.projectId), isNull(tasks.archivedAt)) });
  if (!task) throw new Error("The task is unavailable.");
  await db.update(tasks).set({ title: value.title, description: value.description, status: value.status, priority: value.priority, dueDate: value.dueDate, focusDate: value.focusDate, updatedAt: new Date() }).where(eq(tasks.id, taskId));
  refresh(value.projectId);
}

export async function toggleTaskCompletion(taskId: string, projectId: string, completed: boolean) {
  await db.update(tasks).set({ status: completed ? "completed" : "todo", updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  refresh(projectId);
}

export async function archiveTask(taskId: string, projectId: string) {
  const allTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  const ids = descendantIds(taskId, allTasks as TaskRecord[]);
  if (!ids.length) return;
  await db.update(tasks).set({ archivedAt: new Date(), updatedAt: new Date() }).where(inArray(tasks.id, ids));
  refresh(projectId);
}

export async function restoreTask(taskId: string, projectId: string) {
  const project = await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), isNull(projects.archivedAt)) });
  if (!project) throw new Error("Restore the project before restoring its tasks.");
  const allTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  const byId = new Map(allTasks.map((task) => [task.id, task]));
  const ids = new Set(descendantIds(taskId, allTasks as TaskRecord[]));
  let current = byId.get(taskId);
  while (current?.parentTaskId) { ids.add(current.parentTaskId); current = byId.get(current.parentTaskId); }
  await db.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(inArray(tasks.id, [...ids]));
  refresh(projectId);
}

export async function removeTaskAttachment(attachmentId: string, projectId: string) {
  const attachment = await db.query.taskAttachments.findFirst({ where: eq(taskAttachments.id, attachmentId) });
  if (!attachment) return;
  const task = await db.query.tasks.findFirst({ where: and(eq(tasks.id, attachment.taskId), eq(tasks.projectId, projectId)) });
  if (!task) throw new Error("The attachment is unavailable.");
  await del(attachment.blobUrl);
  await db.delete(taskAttachments).where(eq(taskAttachments.id, attachmentId));
  refresh(projectId);
}
