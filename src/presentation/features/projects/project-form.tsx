"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  createProject as defaultCreateProject,
  updateProject as defaultUpdateProject,
} from "@/actions/project.actions";
import { projectInputSchema } from "@/domain/project/validation";
import { z } from "zod";
import {
  priorities,
  projectStatuses,
  priorityLabels,
  projectStatusLabels,
  type Priority,
  type ProjectStatus,
} from "@/types/domain";

type Values = {
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  dueDate: string | null;
};

export interface ProjectFormProps {
  project?: Values & { id: string };
  onCreateProject?: (input: z.input<typeof projectInputSchema>) => Promise<string>;
  onUpdateProject?: (id: string, input: z.input<typeof projectInputSchema>) => Promise<void>;
}

export function ProjectForm({
  project,
  onCreateProject = defaultCreateProject,
  onUpdateProject = defaultUpdateProject,
}: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "active",
  );
  const [priority, setPriority] = useState<Priority>(
    project?.priority ?? "none",
  );
  const title = project ? "Edit project" : "New project";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={project ? "outline" : "default"}
          size={project ? "sm" : "default"}
        >
          {project ? (
            "Edit project"
          ) : (
            <>
              <Plus className="size-4" />
              New project
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Keep the details lightweight. You can refine them later.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const input = {
              name: String(form.get("name") ?? ""),
              description: String(form.get("description") ?? ""),
              status,
              priority,
              dueDate: String(form.get("dueDate") ?? ""),
            };
            startTransition(async () => {
              if (project) await onUpdateProject(project.id, input);
              else await onCreateProject(input);
              setOpen(false);
            });
          }}
          className="space-y-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project?.name}
              required
              maxLength={120}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {projectStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={project?.dueDate ?? ""}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
