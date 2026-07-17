import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { toTaskTree, type TaskRecord } from "@/features/tasks/tree";

export type ProjectSummary = typeof projects.$inferSelect & { openTaskCount: number; progress: number };

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
  return projectRows.map((project) => summarize(project, taskRows.filter((task) => task.projectId === project.id)));
}

export async function getProjectDetail(projectId: string) {
  const project = await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), isNull(projects.archivedAt)) });
  if (!project) return null;
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  return { project: summarize(project, taskRows), taskTree: toTaskTree(taskRows) };
}

export async function getArchivedProjects() {
  const archivedProjects = await db.select().from(projects).where(isNotNull(projects.archivedAt)).orderBy(desc(projects.archivedAt));
  const archivedTasks = await db.select().from(tasks).where(isNotNull(tasks.archivedAt)).orderBy(desc(tasks.archivedAt));
  return { archivedProjects, archivedTasks };
}
