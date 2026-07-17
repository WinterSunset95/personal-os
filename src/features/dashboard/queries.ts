import { desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { todayIso } from "@/lib/date";
import { getProjectSummaries, withAttachmentCounts } from "@/features/projects/queries";
import { defaultTaskQuery, matchesTask, sortTasks, type TaskQuery } from "@/features/tasks/task-query";

export async function getDashboardData(query: TaskQuery = defaultTaskQuery) {
  const today = todayIso();
  const [taskRows, activeProjects, recentProjects] = await Promise.all([
    db.select().from(tasks).where(isNull(tasks.archivedAt)),
    getProjectSummaries(),
    db.select().from(projects).where(isNull(projects.archivedAt)).orderBy(desc(projects.updatedAt)).limit(6),
  ]);
  const visibleTasks = sortTasks((await withAttachmentCounts(taskRows)).filter((task) => matchesTask(task, query)), query);
  const focusTasks = visibleTasks.filter((task) => task.status !== "completed" && (task.dueDate === today || task.focusDate === today)).slice(0, 6);
  const highPriorityTasks = visibleTasks.filter((task) => task.status !== "completed" && task.priority === "high").slice(0, 6);
  const waitingTasks = visibleTasks.filter((task) => task.status === "waiting").slice(0, 6);
  const recentTasks = [...visibleTasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);
  return {
    focusTasks: focusTasks.map((task) => ({ ...task, source: task.dueDate === today && task.focusDate === today ? "Due today · Focused" : task.dueDate === today ? "Due today" : "Focused" })),
    highPriorityTasks,
    waitingTasks,
    activeProjects: activeProjects.filter((project) => project.status === "active").slice(0, 6),
    recent: [
      ...recentProjects.map((project) => ({ id: project.id, label: project.name, type: "Project" as const, updatedAt: project.updatedAt, href: `/projects/${project.id}` })),
      ...recentTasks.map((task) => ({ id: task.id, label: task.title, type: "Task" as const, updatedAt: task.updatedAt, href: `/projects/${task.projectId}` })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6),
  };
}
