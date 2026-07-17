import { Badge } from "@/components/ui/badge";
import { priorityLabels, projectStatusLabels, taskStatusLabels, type Priority, type ProjectStatus, type TaskStatus } from "@/types/domain";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "none") return null;
  const styles = { high: "border-red-200 bg-red-50 text-red-700", medium: "border-orange-200 bg-orange-50 text-orange-700", low: "border-green-200 bg-green-50 text-green-700" } as const;
  return <Badge variant="outline" className={styles[priority]}>{priorityLabels[priority]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant="secondary">{projectStatusLabels[status]}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles = { todo: "border-zinc-200 bg-zinc-100 text-zinc-700", in_progress: "border-blue-200 bg-blue-50 text-blue-700", waiting: "border-yellow-200 bg-yellow-50 text-yellow-800", blocked: "border-red-200 bg-red-50 text-red-700", completed: "border-green-200 bg-green-50 text-green-700" } as const;
  return <Badge variant="outline" className={styles[status]}>{taskStatusLabels[status]}</Badge>;
}
