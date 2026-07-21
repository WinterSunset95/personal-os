import type { TaskRecord } from "@/domain/task/tree";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  status: "planned" | "active" | "on_hold" | "completed";
  priority: "none" | "low" | "medium" | "high";
  dueDate: string | null;
  isSystemInbox: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  openTaskCount: number;
  progress: number;
};

export function summarizeProject(
  project: Omit<ProjectSummary, "openTaskCount" | "progress">,
  projectTasks: TaskRecord[],
): ProjectSummary {
  const active = projectTasks.filter((task) => !task.archivedAt);
  const completed = active.filter((task) => task.status === "completed").length;
  return {
    ...project,
    openTaskCount: active.filter((task) => task.status !== "completed").length,
    progress: active.length ? Math.round((completed / active.length) * 100) : 0,
  };
}

export function canArchiveProject(
  project: { isSystemInbox?: boolean } | null | undefined,
): boolean {
  if (project?.isSystemInbox) {
    return false;
  }
  return true;
}
