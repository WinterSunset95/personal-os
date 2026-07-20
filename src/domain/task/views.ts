import { z } from "zod";
import { taskStatuses } from "./types";
import {
  defaultTaskQuery,
  parseTaskQuery,
  taskQuerySchema,
  type TaskQuery,
} from "./query";

const incompleteStatuses = taskStatuses.filter(
  (status) => status !== "completed",
);

export const builtInTaskViews = [
  {
    id: "builtin-overdue",
    name: "Overdue",
    query: {
      ...defaultTaskQuery,
      statuses: incompleteStatuses,
      due: "overdue",
    },
  },
  {
    id: "builtin-this-week",
    name: "This Week",
    query: {
      ...defaultTaskQuery,
      statuses: incompleteStatuses,
      due: "this_week",
    },
  },
  {
    id: "builtin-waiting",
    name: "Waiting",
    query: { ...defaultTaskQuery, statuses: ["waiting"], due: null },
  },
] as const satisfies readonly { id: string; name: string; query: TaskQuery }[];

export type TaskViewOption = {
  id: string;
  name: string;
  query: TaskQuery;
  projectId: string | null;
  builtIn: boolean;
};

export function findTaskView(views: TaskViewOption[], viewId?: string) {
  return views.find((view) => view.id === viewId);
}

export function resolveTaskViewQuery(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  views: TaskViewOption[],
) {
  const read = (key: string) =>
    source instanceof URLSearchParams
      ? source.get(key)
      : Array.isArray(source[key])
        ? source[key][0]
        : source[key];
  const has = (key: string) => read(key) !== undefined && read(key) !== null;
  const selectedView = findTaskView(views, read("view") ?? undefined);
  const requested = parseTaskQuery(source);
  if (!selectedView) return { query: requested, selectedView: undefined };
  const query: TaskQuery = {
    sort: has("sort") ? requested.sort : selectedView.query.sort,
    direction: has("direction")
      ? requested.direction
      : selectedView.query.direction,
    statuses: has("status") ? requested.statuses : selectedView.query.statuses,
    priorities: has("priority")
      ? requested.priorities
      : selectedView.query.priorities,
    due: has("due") ? requested.due : selectedView.query.due,
    hasAttachments: has("attachments")
      ? requested.hasAttachments
      : selectedView.query.hasAttachments,
  };
  return { query, selectedView };
}

export const taskViewInputSchema = z.object({
  name: z.string().trim().min(1, "View name is required.").max(60),
  projectId: z.string().uuid().nullable(),
  query: taskQuerySchema,
});
