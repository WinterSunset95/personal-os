import { desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { taskViews } from "@/db/schema";
import { taskStatuses } from "@/types/domain";
import { defaultTaskQuery, parseTaskQuery, taskQuerySchema, type TaskQuery } from "./task-query";

const incompleteStatuses = taskStatuses.filter((status) => status !== "completed");

export const builtInTaskViews = [
  { id: "builtin-overdue", name: "Overdue", query: { ...defaultTaskQuery, statuses: incompleteStatuses, due: "overdue" } },
  { id: "builtin-this-week", name: "This Week", query: { ...defaultTaskQuery, statuses: incompleteStatuses, due: "this_week" } },
  { id: "builtin-waiting", name: "Waiting", query: { ...defaultTaskQuery, statuses: ["waiting"], due: null } },
] as const satisfies readonly { id: string; name: string; query: TaskQuery }[];

export type SavedTaskView = typeof taskViews.$inferSelect;
export type TaskViewOption = { id: string; name: string; query: TaskQuery; projectId: string | null; builtIn: boolean };

export async function getTaskViews(projectId?: string): Promise<TaskViewOption[]> {
  const scope = projectId
    ? or(isNull(taskViews.projectId), eq(taskViews.projectId, projectId))
    : isNull(taskViews.projectId);
  const customViews = await db.select().from(taskViews).where(scope).orderBy(desc(taskViews.updatedAt));
  return [
    ...builtInTaskViews.map((view) => ({ ...view, projectId: null, builtIn: true })),
    ...customViews.map((view) => ({ ...view, query: taskQuerySchema.parse(view.query), builtIn: false })),
  ];
}

export function findTaskView(views: TaskViewOption[], viewId?: string) {
  return views.find((view) => view.id === viewId);
}

export function resolveTaskViewQuery(source: URLSearchParams | Record<string, string | string[] | undefined>, views: TaskViewOption[]) {
  const read = (key: string) => source instanceof URLSearchParams ? source.get(key) : Array.isArray(source[key]) ? source[key][0] : source[key];
  const has = (key: string) => read(key) !== undefined && read(key) !== null;
  const selectedView = findTaskView(views, read("view") ?? undefined);
  const requested = parseTaskQuery(source);
  if (!selectedView) return { query: requested, selectedView: undefined };
  const query: TaskQuery = {
    sort: has("sort") ? requested.sort : selectedView.query.sort,
    direction: has("direction") ? requested.direction : selectedView.query.direction,
    statuses: has("status") ? requested.statuses : selectedView.query.statuses,
    priorities: has("priority") ? requested.priorities : selectedView.query.priorities,
    due: has("due") ? requested.due : selectedView.query.due,
    hasAttachments: has("attachments") ? requested.hasAttachments : selectedView.query.hasAttachments,
  };
  return { query, selectedView };
}
