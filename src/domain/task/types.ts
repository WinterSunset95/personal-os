export const taskStatuses = [
  "todo",
  "in_progress",
  "waiting",
  "blocked",
  "completed",
] as const;
export const priorities = ["none", "low", "medium", "high"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type Priority = (typeof priorities)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  waiting: "Waiting",
  blocked: "Blocked",
  completed: "Done",
};

export const priorityLabels: Record<Priority, string> = {
  none: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
};
