import { Badge } from "@/components/ui/badge";
import { priorityLabels, projectStatusLabels, taskStatusLabels, type Priority, type ProjectStatus, type TaskStatus } from "@/types/domain";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "none") return null;
  return <Badge variant="outline" className={priority === "high" ? "border-foreground/25" : "text-muted-foreground"}>{priorityLabels[priority]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant="secondary">{projectStatusLabels[status]}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant="secondary">{taskStatusLabels[status]}</Badge>;
}
