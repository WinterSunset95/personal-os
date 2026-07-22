import { Badge } from "@/components/ui/badge";
import {
  priorityLabels,
  projectStatusLabels,
  taskStatusLabels,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
} from "@/types/domain";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "none") return null;
  const styles = {
    high: "border-red-200/70 bg-red-500/10 text-red-600 dark:text-red-300",
    medium:
      "border-amber-200/70 bg-amber-400/15 text-amber-700 dark:text-amber-300",
    low: "border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  } as const;
  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2 py-0.5 font-medium ${styles[priority]}`}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="secondary" className="rounded-md px-2 py-0.5 font-medium">
      {projectStatusLabels[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles = {
    todo: "border-slate-200/70 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress:
      "border-blue-200/70 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    waiting:
      "border-amber-200/70 bg-amber-400/15 text-amber-700 dark:text-amber-300",
    blocked: "border-red-200/70 bg-red-500/10 text-red-600 dark:text-red-300",
    completed:
      "border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  } as const;
  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2 py-0.5 font-medium ${styles[status]}`}
    >
      {taskStatusLabels[status]}
    </Badge>
  );
}
