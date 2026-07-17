"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTask, updateTask } from "@/features/projects/actions";
import { priorities, priorityLabels, taskStatuses, taskStatusLabels, type Priority, type TaskStatus } from "@/types/domain";

type Values = { id: string; projectId: string; parentTaskId: string | null; title: string; description: string | null; status: TaskStatus; priority: Priority; dueDate: string | null; focusDate: string | null };
export function TaskForm({ projectId, parentTaskId = null, task }: { projectId: string; parentTaskId?: string | null; task?: Values }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  const isEdit = Boolean(task);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant={isEdit ? "ghost" : "outline"}>{isEdit ? "Edit" : <><Plus className="size-4" />{parentTaskId ? "Subtask" : "Add task"}</>}</Button></DialogTrigger><DialogContent>
    <DialogHeader><DialogTitle>{isEdit ? "Edit task" : parentTaskId ? "New subtask" : "New task"}</DialogTitle><DialogDescription>Tasks stay focused, with just enough context to act on them.</DialogDescription></DialogHeader>
    <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = { projectId, parentTaskId: task?.parentTaskId ?? parentTaskId, title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), status: String(form.get("status")) as TaskStatus, priority: String(form.get("priority")) as Priority, dueDate: String(form.get("dueDate") ?? ""), focusDate: String(form.get("focusDate") ?? "") }; startTransition(async () => { if (task) await updateTask(task.id, input); else await createTask(input); setOpen(false); }); }} className="space-y-4">
      <label className="grid gap-1.5 text-sm">Title<Input name="title" defaultValue={task?.title} required maxLength={160} autoFocus /></label>
      <label className="grid gap-1.5 text-sm">Description<Textarea name="description" defaultValue={task?.description ?? ""} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm">Status<select name="status" defaultValue={task?.status ?? "todo"} className="h-9 rounded-md border bg-background px-3 text-sm">{taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}</select></label><label className="grid gap-1.5 text-sm">Priority<select name="priority" defaultValue={task?.priority ?? "none"} className="h-9 rounded-md border bg-background px-3 text-sm">{priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm">Due date<Input name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} /></label><label className="grid gap-1.5 text-sm">Focus date<Input name="focusDate" type="date" defaultValue={task?.focusDate ?? ""} /></label></div>
      <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save task"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
