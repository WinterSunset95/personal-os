import { todayIso } from "@/lib/date";
import { z } from "zod";
import {
  priorities,
  taskStatuses,
  type Priority,
  type TaskStatus,
} from "@/domain/task/types";
import type { TaskRecord, TaskTreeNode } from "./tree";

export const taskSorts = [
  "priority",
  "due_date",
  "status",
  "updated_at",
] as const;
export const dueFilters = [
  "today",
  "this_week",
  "overdue",
  "no_due_date",
] as const;
export type TaskSort = (typeof taskSorts)[number];
export type DueFilter = (typeof dueFilters)[number];
export type TaskQuery = {
  sort: TaskSort;
  direction: "asc" | "desc";
  statuses: TaskStatus[];
  priorities: Priority[];
  due: DueFilter | null;
  hasAttachments: boolean;
};

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};
const statusRank: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  waiting: 2,
  blocked: 3,
  completed: 4,
};
export const defaultTaskQuery: TaskQuery = {
  sort: "priority",
  direction: "asc",
  statuses: [],
  priorities: [],
  due: null,
  hasAttachments: false,
};
export const taskQuerySchema = z.object({
  sort: z.enum(taskSorts),
  direction: z.enum(["asc", "desc"]),
  statuses: z.array(z.enum(taskStatuses)),
  priorities: z.array(z.enum(priorities)),
  due: z.enum(dueFilters).nullable(),
  hasAttachments: z.boolean(),
});

export function parseTaskQuery(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): TaskQuery {
  const read = (key: string) =>
    source instanceof URLSearchParams
      ? source.get(key)
      : Array.isArray(source[key])
        ? source[key][0]
        : source[key];
  const values = <T extends readonly string[]>(key: string, allowed: T) =>
    (read(key) ?? "")
      .split(",")
      .filter((value): value is T[number] =>
        allowed.includes(value as T[number]),
      );
  const sort = values("sort", taskSorts)[0] ?? defaultTaskQuery.sort;
  const direction = read("direction") === "desc" ? "desc" : "asc";
  const due = values("due", dueFilters)[0] ?? null;
  return {
    sort,
    direction,
    statuses: values("status", taskStatuses),
    priorities: values("priority", priorities),
    due,
    hasAttachments: read("attachments") === "true",
  };
}

export function taskQueryToSearchParams(query: TaskQuery, viewId?: string) {
  const params = new URLSearchParams({
    sort: query.sort,
    direction: query.direction,
  });
  if (query.statuses.length) params.set("status", query.statuses.join(","));
  if (query.priorities.length)
    params.set("priority", query.priorities.join(","));
  if (query.due) params.set("due", query.due);
  if (query.hasAttachments) params.set("attachments", "true");
  if (viewId) params.set("view", viewId);
  return params;
}

export function sameTaskQuery(left: TaskQuery, right: TaskQuery) {
  return (
    left.sort === right.sort &&
    left.direction === right.direction &&
    left.due === right.due &&
    left.hasAttachments === right.hasAttachments &&
    [...left.statuses].sort().join(",") ===
      [...right.statuses].sort().join(",") &&
    [...left.priorities].sort().join(",") ===
      [...right.priorities].sort().join(",")
  );
}

export function hasTaskFilters(query: TaskQuery) {
  return (
    query.statuses.length > 0 ||
    query.priorities.length > 0 ||
    query.due !== null ||
    query.hasAttachments
  );
}

function dueMatches(
  task: TaskRecord,
  due: DueFilter,
  today: string = todayIso(),
) {
  if (due === "no_due_date") return !task.dueDate;
  if (!task.dueDate) return false;
  if (due === "today") return task.dueDate === today;
  if (due === "overdue") return task.dueDate < today;
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 6);
  return (
    task.dueDate >= today && task.dueDate <= end.toISOString().slice(0, 10)
  );
}

export function matchesTask(
  task: TaskRecord,
  query: TaskQuery,
  today: string = todayIso(),
) {
  return (
    (!query.statuses.length || query.statuses.includes(task.status)) &&
    (!query.priorities.length || query.priorities.includes(task.priority)) &&
    (!query.due || dueMatches(task, query.due, today)) &&
    (!query.hasAttachments || task.attachmentCount > 0)
  );
}

function compareDefault(a: TaskRecord, b: TaskRecord) {
  const aDone = a.status === "completed";
  const bDone = b.status === "completed";
  if (aDone !== bDone) return aDone ? 1 : -1;
  if (!aDone && priorityRank[a.priority] !== priorityRank[b.priority])
    return priorityRank[a.priority] - priorityRank[b.priority];
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  }
  return a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime();
}

export function compareTasks(
  a: TaskRecord,
  b: TaskRecord,
  query: TaskQuery = defaultTaskQuery,
) {
  if (query.sort === "priority" && query.direction === "asc")
    return compareDefault(a, b);
  let result = 0;
  if (query.sort === "priority")
    result = priorityRank[a.priority] - priorityRank[b.priority];
  if (query.sort === "status")
    result = statusRank[a.status] - statusRank[b.status];
  if (query.sort === "due_date") {
    if (!a.dueDate) result = 1;
    else if (!b.dueDate) result = -1;
    else result = a.dueDate.localeCompare(b.dueDate);
  }
  if (query.sort === "updated_at")
    result = a.updatedAt.getTime() - b.updatedAt.getTime();
  if (result === 0) result = compareDefault(a, b);
  return query.direction === "desc" ? -result : result;
}

export function sortTasks<T extends TaskRecord>(items: T[], query: TaskQuery) {
  return [...items].sort((a, b) => compareTasks(a, b, query));
}

export function filterTaskTree(
  nodes: TaskTreeNode[],
  query: TaskQuery,
  today: string = todayIso(),
): TaskTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterTaskTree(node.children, query, today);
    const directMatch = matchesTask(node, query, today);
    if (!directMatch && children.length === 0) return [];
    return [{ ...node, children, isContext: !directMatch }];
  });
}
