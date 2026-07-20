"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createTask, updateTask } from "@/features/projects/actions";
import { priorities, priorityLabels, taskStatuses, taskStatusLabels, type Priority, type TaskStatus } from "@/types/domain";
import { TaskAttachments } from "./task-attachments";
import type { TaskAttachmentRecord } from "@/domain/task/tree";

type Values = { id: string; projectId: string; parentTaskId: string | null; title: string; description: string | null; status: TaskStatus; priority: Priority; dueDate: string | null; focusDate: string | null; attachments: TaskAttachmentRecord[] };
export function TaskForm({ projectId, parentTaskId = null, task }: { projectId: string; parentTaskId?: string | null; task?: Values }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "none");
  const isEdit = Boolean(task);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant={isEdit ? "ghost" : "outline"}>{isEdit ? "Edit" : <><Plus className="size-4" />{parentTaskId ? "Subtask" : "Add task"}</>}</Button></DialogTrigger><DialogContent>
    <DialogHeader><DialogTitle>{isEdit ? "Edit task" : parentTaskId ? "New subtask" : "New task"}</DialogTitle><DialogDescription>Tasks stay focused, with just enough context to act on them.</DialogDescription></DialogHeader>
    <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = { projectId, parentTaskId: task?.parentTaskId ?? parentTaskId, title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), status, priority, dueDate: String(form.get("dueDate") ?? ""), focusDate: String(form.get("focusDate") ?? "") }; startTransition(async () => { if (task) await updateTask(task.id, input); else await createTask(input); setOpen(false); }); }} className="space-y-4">
      <div className="grid gap-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={task?.title} required maxLength={160} autoFocus /></div>
      <div className="grid gap-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={task?.description ?? ""} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map((status) => <SelectItem key={status} value={status}>{taskStatusLabels[status]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => <SelectItem key={priority} value={priority}>{priorityLabels[priority]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5"><Label htmlFor="dueDate">Due date</Label><Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} /></div>
        <div className="grid gap-1.5"><Label htmlFor="focusDate">Focus date</Label><Input id="focusDate" name="focusDate" type="date" defaultValue={task?.focusDate ?? ""} /></div>
      </div>
      {task && <TaskAttachments taskId={task.id} projectId={projectId} attachments={task.attachments} />}
      <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save task"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
