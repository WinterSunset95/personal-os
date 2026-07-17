export const projectStatuses = ["planned", "active", "on_hold", "completed"] as const;
export const taskStatuses = ["todo", "in_progress", "waiting", "blocked", "completed"] as const;
export const priorities = ["none", "low", "medium", "high"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type Priority = (typeof priorities)[number];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: "Planned", active: "Active", on_hold: "On hold", completed: "Completed",
};
export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", waiting: "Waiting", blocked: "Blocked", completed: "Done",
};
export const priorityLabels: Record<Priority, string> = {
  none: "No priority", low: "Low", medium: "Medium", high: "High",
};
