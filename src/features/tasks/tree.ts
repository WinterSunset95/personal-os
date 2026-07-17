import type { Priority, TaskStatus } from "@/types/domain";
import { compareTasks, defaultTaskQuery, type TaskQuery } from "./task-query";

export type TaskAttachmentRecord = { id: string; fileName: string; contentType: string; size: number; createdAt: Date };
export type TaskRecord = {
  id: string; projectId: string; parentTaskId: string | null; title: string; description: string | null;
  status: TaskStatus; priority: Priority; dueDate: string | null; focusDate: string | null; order: number;
  createdAt: Date; updatedAt: Date; archivedAt: Date | null;
  attachmentCount: number;
  attachments: TaskAttachmentRecord[];
};

export type TaskTreeNode = TaskRecord & { children: TaskTreeNode[]; isContext?: boolean };

export function toTaskTree(records: TaskRecord[], query: TaskQuery = defaultTaskQuery): TaskTreeNode[] {
  const nodes = new Map(records.map((task) => [task.id, { ...task, children: [] as TaskTreeNode[] }]));
  const roots: TaskTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentTaskId ? nodes.get(node.parentTaskId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortTree = (items: TaskTreeNode[]) => {
    items.sort((a, b) => compareTasks(a, b, query));
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
