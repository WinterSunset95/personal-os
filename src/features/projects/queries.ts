import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projects, taskAttachments, tasks } from "@/db/schema";
import { toTaskTree, type TaskRecord } from "@/features/tasks/tree";
import { defaultTaskQuery, filterTaskTree, hasTaskFilters, type TaskQuery } from "@/features/tasks/task-query";
import { matchesTask, sortTasks } from "@/features/tasks/task-query";

export type ProjectSummary = typeof projects.$inferSelect & { openTaskCount: number; progress: number };

export async function withAttachmentCounts(taskRows: (typeof tasks.$inferSelect)[]) {
  if (!taskRows.length) return [] as TaskRecord[];
  const attachments = await db.select().from(taskAttachments);
  const counts = new Map<string, number>();
  attachments.forEach(({ taskId }) => counts.set(taskId, (counts.get(taskId) ?? 0) + 1));
  return taskRows.map((task) => ({ ...task, attachmentCount: counts.get(task.id) ?? 0, attachments: attachments.filter((attachment) => attachment.taskId === task.id).map(({ id, fileName, contentType, size, createdAt }) => ({ id, fileName, contentType, size, createdAt })) }));
}

function summarize(project: typeof projects.$inferSelect, projectTasks: TaskRecord[]): ProjectSummary {
  const active = projectTasks.filter((task) => !task.archivedAt);
  const completed = active.filter((task) => task.status === "completed").length;
  return { ...project, openTaskCount: active.filter((task) => task.status !== "completed").length, progress: active.length ? Math.round((completed / active.length) * 100) : 0 };
}

export async function getProjectSummaries() {
  const [projectRows, taskRows] = await Promise.all([
    db.select().from(projects).where(isNull(projects.archivedAt)).orderBy(desc(projects.updatedAt)),
    db.select().from(tasks).where(isNull(tasks.archivedAt)),
  ]);
  const tasksWithAttachments = await withAttachmentCounts(taskRows);
  return projectRows.map((project) => summarize(project, tasksWithAttachments.filter((task) => task.projectId === project.id)));
}

export async function getProjectDetail(projectId: string, query: TaskQuery = defaultTaskQuery) {
  const project = await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), isNull(projects.archivedAt)) });
  if (!project) return null;
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  const tasksWithAttachments = await withAttachmentCounts(taskRows);
  const taskTree = toTaskTree(tasksWithAttachments, query);
  return { project: summarize(project, tasksWithAttachments), taskTree: hasTaskFilters(query) ? filterTaskTree(taskTree, query) : taskTree };
}

export async function getArchivedProjects() {
  const archivedProjects = await db.select().from(projects).where(isNotNull(projects.archivedAt)).orderBy(desc(projects.archivedAt));
  const archivedTasks = await db.select().from(tasks).where(isNotNull(tasks.archivedAt)).orderBy(desc(tasks.archivedAt));
  return { archivedProjects, archivedTasks };
}

export async function getDocumentInbox(query: TaskQuery = defaultTaskQuery) {
  const [taskRows, projectRows] = await Promise.all([
    db.select().from(tasks).where(isNull(tasks.archivedAt)),
    db.select().from(projects).where(isNull(projects.archivedAt)),
  ]);
  const documents = sortTasks((await withAttachmentCounts(taskRows)).filter((task) => task.attachmentCount > 0 && matchesTask(task, query)), query);
  const projectNames = new Map(projectRows.map((project) => [project.id, project.name]));
  return documents.map((task) => ({ ...task, projectName: projectNames.get(task.projectId) ?? "Archived project" }));
}
