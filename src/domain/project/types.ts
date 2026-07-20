export const projectStatuses = ["planned", "active", "on_hold", "completed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};
