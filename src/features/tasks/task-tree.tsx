"use client";

import { useState, useTransition } from "react";
import { Archive, ChevronDown, ChevronRight, Flag, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import { archiveTask, toggleTaskCompletion } from "@/features/projects/actions";
import type { TaskTreeNode } from "./tree";
import { TaskForm } from "./task-form";

export function TaskTree({ projectId, tasks, forceExpanded = false }: { projectId: string; tasks: TaskTreeNode[]; forceExpanded?: boolean }) {
  if (!tasks.length) return <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">No tasks yet. Add the first small step.</div>;
  return <div className="divide-y rounded-lg border bg-background">{tasks.map((task) => <TaskBranch key={task.id} task={task} projectId={projectId} depth={0} forceExpanded={forceExpanded} />)}</div>;
}

function TaskBranch({ task, projectId, depth, forceExpanded }: { task: TaskTreeNode; projectId: string; depth: number; forceExpanded: boolean }) {
  const [expanded, setExpanded] = useState(forceExpanded); const [pending, startTransition] = useTransition();
  const completed = task.status === "completed";
  return <div><div className="flex min-h-16 items-center gap-2 px-3 py-2" style={{ paddingLeft: `${12 + depth * 24}px` }}>
    {task.children.length ? <Button type="button" variant="ghost" size="icon-sm" aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</Button> : <span className="w-7" />}
    <input type="checkbox" checked={completed} onChange={(event) => startTransition(async () => toggleTaskCompletion(task.id, projectId, event.target.checked))} disabled={pending} className="size-4 accent-foreground" aria-label={`Mark ${task.title} complete`} />
    <div className="min-w-0 flex-1"><p className={`${completed ? "text-muted-foreground line-through" : "font-medium"} ${task.isContext ? "opacity-55" : ""} truncate text-sm`}>{task.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><TaskStatusBadge status={task.status} /><PriorityBadge priority={task.priority} />{task.dueDate && <span>{formatDate(task.dueDate)}</span>}{task.focusDate && <span className="inline-flex items-center gap-1"><Flag className="size-3" />Focused</span>}{task.attachmentCount > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="size-3" />{task.attachmentCount}</span>}</div></div>
    <div className="hidden items-center gap-1 sm:flex"><TaskForm projectId={projectId} parentTaskId={task.id} /><TaskForm projectId={projectId} task={task} /><Button type="button" variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Archive “${task.title}” and its subtasks?`)) startTransition(async () => archiveTask(task.id, projectId)); }} aria-label={`Archive ${task.title}`}><Archive className="size-4" /></Button></div>
  </div>{expanded && task.children.map((child) => <TaskBranch key={child.id} task={child} projectId={projectId} depth={depth + 1} forceExpanded={forceExpanded} />)}</div>;
}
