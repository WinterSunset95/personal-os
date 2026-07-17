"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { projects, taskViews } from "@/db/schema";
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
  const project = await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), isNull(projects.archivedAt)) });
  if (!project) throw new Error("Project views require an active project.");
}

export async function createTaskView(input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  await ensureProject(value.projectId);
  const [view] = await db.insert(taskViews).values(value).returning();
  refresh(value.projectId);
  return view.id;
}

export async function updateTaskView(viewId: string, input: z.input<typeof taskViewInput>) {
  const value = taskViewInput.parse(input);
  const existing = await db.query.taskViews.findFirst({ where: eq(taskViews.id, viewId) });
  if (!existing) throw new Error("Saved view is unavailable.");
  if (existing.projectId !== value.projectId) throw new Error("Saved view scope cannot be changed.");
  await ensureProject(value.projectId);
  await db.update(taskViews).set({ name: value.name, query: value.query, updatedAt: new Date() }).where(eq(taskViews.id, viewId));
  refresh(value.projectId);
}

export async function deleteTaskView(viewId: string) {
  const existing = await db.query.taskViews.findFirst({ where: eq(taskViews.id, viewId) });
  if (!existing) return;
  await db.delete(taskViews).where(eq(taskViews.id, viewId));
  refresh(existing.projectId);
}
