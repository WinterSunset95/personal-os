import { and, desc, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { todayIso } from "@/lib/date";
import { getProjectSummaries } from "@/features/projects/queries";

export async function getDashboardData() {
  const today = todayIso();
  const [focusTasks, highPriorityTasks, activeProjects, recentProjects, recentTasks] = await Promise.all([
    db.select().from(tasks).where(and(isNull(tasks.archivedAt), ne(tasks.status, "completed"), or(eq(tasks.dueDate, today), eq(tasks.focusDate, today)))).orderBy(desc(tasks.updatedAt)).limit(6),
    db.select().from(tasks).where(and(isNull(tasks.archivedAt), ne(tasks.status, "completed"), eq(tasks.priority, "high"))).orderBy(desc(tasks.updatedAt)).limit(6),
    getProjectSummaries(),
    db.select().from(projects).where(isNull(projects.archivedAt)).orderBy(desc(projects.updatedAt)).limit(6),
    db.select().from(tasks).where(isNull(tasks.archivedAt)).orderBy(desc(tasks.updatedAt)).limit(6),
  ]);
  return {
    focusTasks: focusTasks.map((task) => ({ ...task, source: task.dueDate === today && task.focusDate === today ? "Due today · Focused" : task.dueDate === today ? "Due today" : "Focused" })),
    highPriorityTasks,
    activeProjects: activeProjects.filter((project) => project.status === "active").slice(0, 6),
    recent: [
      ...recentProjects.map((project) => ({ id: project.id, label: project.name, type: "Project" as const, updatedAt: project.updatedAt, href: `/projects/${project.id}` })),
      ...recentTasks.map((task) => ({ id: task.id, label: task.title, type: "Task" as const, updatedAt: task.updatedAt, href: `/projects/${task.projectId}` })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6),
  };
}
