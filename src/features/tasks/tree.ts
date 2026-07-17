import type { Priority, TaskStatus } from "@/types/domain";

export type TaskRecord = {
  id: string; projectId: string; parentTaskId: string | null; title: string; description: string | null;
  status: TaskStatus; priority: Priority; dueDate: string | null; focusDate: string | null; order: number;
  createdAt: Date; updatedAt: Date; archivedAt: Date | null;
};

export type TaskTreeNode = TaskRecord & { children: TaskTreeNode[] };

const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

function compareTasks(a: TaskTreeNode, b: TaskTreeNode) {
  const aComplete = a.status === "completed";
  const bComplete = b.status === "completed";
  if (aComplete !== bComplete) return aComplete ? 1 : -1;
  if (!aComplete && priorityWeight[a.priority] !== priorityWeight[b.priority]) {
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  }
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  }
  return a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime();
}

export function toTaskTree(records: TaskRecord[]): TaskTreeNode[] {
  const nodes = new Map(records.map((task) => [task.id, { ...task, children: [] as TaskTreeNode[] }]));
  const roots: TaskTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentTaskId ? nodes.get(node.parentTaskId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortTree = (items: TaskTreeNode[]) => {
    items.sort(compareTasks);
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

export function descendantIds(taskId: string, records: Pick<TaskRecord, "id" | "parentTaskId">[]) {
  const children = new Map<string, string[]>();
  records.forEach((task) => {
    if (!task.parentTaskId) return;
    children.set(task.parentTaskId, [...(children.get(task.parentTaskId) ?? []), task.id]);
  });
  const ids: string[] = [];
  const visit = (id: string) => { ids.push(id); (children.get(id) ?? []).forEach(visit); };
  visit(taskId);
  return ids;
}
