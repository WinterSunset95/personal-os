"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { withAttachmentCounts } from "@/features/projects/queries";

export async function searchTasks(term: string) {
  const query = z.string().trim().min(1).max(100).parse(term).toLowerCase();
  const rows = await db.select({ task: tasks, projectName: projects.name }).from(tasks).innerJoin(projects, eq(tasks.projectId, projects.id)).where(and(isNull(tasks.archivedAt), isNull(projects.archivedAt)));
  const taskRows = await withAttachmentCounts(rows.map((row) => row.task));
  return taskRows.filter((task) => [task.title, task.description ?? "", rows.find((row) => row.task.id === task.id)?.projectName ?? "", ...task.tags.map((tag) => tag.name), ...task.attachments.map((file) => file.fileName)].some((value) => value.toLowerCase().includes(query))).slice(0, 20).map((task) => ({ id: task.id, title: task.title, projectId: task.projectId, projectName: rows.find((row) => row.task.id === task.id)?.projectName ?? "", status: task.status, priority: task.priority, tags: task.tags }));
}
