"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "./actions";
import { priorities, projectStatuses, priorityLabels, projectStatusLabels, type Priority, type ProjectStatus } from "@/types/domain";

type Values = { name: string; description: string | null; status: ProjectStatus; priority: Priority; dueDate: string | null };
export function ProjectForm({ project }: { project?: Values & { id: string } }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  const title = project ? "Edit project" : "New project";
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant={project ? "outline" : "default"} size={project ? "sm" : "default"}>{project ? "Edit project" : <><Plus className="size-4" />New project</>}</Button></DialogTrigger><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Keep the details lightweight. You can refine them later.</DialogDescription></DialogHeader>
    <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = { name: String(form.get("name") ?? ""), description: String(form.get("description") ?? ""), status: String(form.get("status")) as ProjectStatus, priority: String(form.get("priority")) as Priority, dueDate: String(form.get("dueDate") ?? "") }; startTransition(async () => { if (project) await updateProject(project.id, input); else await createProject(input); setOpen(false); }); }} className="space-y-4">
      <label className="grid gap-1.5 text-sm">Name<Input name="name" defaultValue={project?.name} required maxLength={120} /></label>
      <label className="grid gap-1.5 text-sm">Description<Textarea name="description" defaultValue={project?.description ?? ""} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm">Status<select name="status" defaultValue={project?.status ?? "active"} className="h-9 rounded-md border bg-background px-3 text-sm">{projectStatuses.map((status) => <option key={status} value={status}>{projectStatusLabels[status]}</option>)}</select></label><label className="grid gap-1.5 text-sm">Priority<select name="priority" defaultValue={project?.priority ?? "none"} className="h-9 rounded-md border bg-background px-3 text-sm">{priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label></div>
      <label className="grid gap-1.5 text-sm">Due date<Input name="dueDate" type="date" defaultValue={project?.dueDate ?? ""} /></label>
      <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save project"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
