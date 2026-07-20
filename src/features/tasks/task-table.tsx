"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Archive, Minus as ChevronDown, MoreHorizontal, Paperclip, Plus, Plus as ChevronRight, Upload } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { archiveTask, createTag, createTask, deleteTag, duplicateTask, removeTaskAttachment, setTaskTags, toggleTaskCompletion, updatePropertyColor, updateTaskProperty } from "@/features/projects/actions";
import { priorities, priorityLabels, taskStatuses, taskStatusLabels } from "@/types/domain";
import type { TaskTreeNode } from "./tree";

type Tag = { id: string; name: string; color: string; projectId: string | null };
type Color = { property: "status" | "priority"; value: string; color: string };
const defaults: Record<string, string> = { todo: "#87909e", in_progress: "#4194f6", waiting: "#f9ab00", blocked: "#e50000", completed: "#6bc950", high: "#f50000", medium: "#f8ae00", low: "#6bc950", none: "#87909e" };

export function TaskTable({ projectId, tasks, availableTags, colors, highlightedTaskId }: { projectId: string; tasks: TaskTreeNode[]; availableTags: Tag[]; colors: Color[]; highlightedTaskId?: string }) {
  const [rootComposer, setRootComposer] = useState(false); const [properties, setProperties] = useState(false);
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/80 p-2 shadow-sm"><Button size="sm" onClick={() => setRootComposer(true)}><Plus className="size-4" />New task</Button><Button size="sm" variant="ghost" onClick={() => setProperties(true)}>Properties</Button></div>{rootComposer && <Composer projectId={projectId} onClose={() => setRootComposer(false)} /> }<div className="overflow-x-auto rounded-2xl border bg-card shadow-sm"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b bg-muted/45 text-xs text-muted-foreground"><tr><th className="w-[33%] px-4 py-3 font-medium">Task</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Priority</th><th className="px-3 py-3 font-medium">Tags</th><th className="px-3 py-3 font-medium">Due date</th><th className="px-3 py-3 font-medium">Focus</th><th className="px-3 py-3 font-medium">Attachments</th><th className="px-3 py-3" /></tr></thead><tbody>{tasks.map((task) => <TaskRow key={task.id} task={task} projectId={projectId} depth={0} tags={availableTags} colors={colors} highlightedTaskId={highlightedTaskId} />)}</tbody></table></div><PropertiesDialog open={properties} onOpenChange={setProperties} projectId={projectId} tags={availableTags} colors={colors} /></div>;
}

function TaskRow({ task, projectId, depth, tags, colors, highlightedTaskId }: { task: TaskTreeNode; projectId: string; depth: number; tags: Tag[]; colors: Color[]; highlightedTaskId?: string }) {
  const containsHighlight = (node: TaskTreeNode): boolean => node.id === highlightedTaskId || node.children.some(containsHighlight); const highlighted = task.id === highlightedTaskId;
  const [expanded, setExpanded] = useState(() => containsHighlight(task)); const [adding, setAdding] = useState(false); const [pending, start] = useTransition(); const rowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => { if (highlighted) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [highlighted]);
  const color = (property: "status" | "priority", value: string) => colors.find((item) => item.property === property && item.value === value)?.color ?? defaults[value];
  const done = task.status === "completed";
  return <><tr ref={rowRef} className={`group border-b last:border-0 ${highlighted ? "bg-primary/10" : "hover:bg-muted/30"}`}><td className="px-3 py-2"><div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 22}px` }}>{task.children.length ? <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpanded(!expanded)} aria-label="Toggle subtasks">{expanded ? <ChevronDown /> : <ChevronRight />}</Button> : <span className="w-7" />}<Checkbox checked={done} disabled={pending} onCheckedChange={(checked) => start(() => toggleTaskCompletion(task.id, projectId, !!checked))} aria-label={`Complete ${task.title}`} /><span className={`min-w-0 flex-1 truncate ${done ? "text-muted-foreground line-through" : "font-medium"}`}>{task.title}</span><button type="button" onClick={() => setAdding(true)} className="hidden text-muted-foreground hover:text-foreground group-hover:inline-flex" aria-label={`Add subtask to ${task.title}`}><Plus className="size-4" /></button></div></td><td className="px-3 py-2"><CellSelect value={task.status} values={taskStatuses} labels={taskStatusLabels} color={color("status", task.status)} onChange={(value) => start(() => updateTaskProperty(task.id, projectId, "status", value))} /></td><td className="px-3 py-2"><CellSelect value={task.priority} values={priorities} labels={priorityLabels} color={color("priority", task.priority)} onChange={(value) => start(() => updateTaskProperty(task.id, projectId, "priority", value))} /></td><td className="px-3 py-2"><TagCell task={task} projectId={projectId} available={tags} /></td><td className="px-3 py-2"><DateCell value={task.dueDate} onChange={(value) => start(() => updateTaskProperty(task.id, projectId, "dueDate", value))} /></td><td className="px-3 py-2"><DateCell value={task.focusDate} onChange={(value) => start(() => updateTaskProperty(task.id, projectId, "focusDate", value))} /></td><td className="px-3 py-2"><AttachmentCell task={task} projectId={projectId} /></td><td className="px-3 py-2"><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="size-4 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setAdding(true)}>Add subtask</DropdownMenuItem><DropdownMenuItem onClick={() => start(() => duplicateTask(task.id, projectId))}>Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${location.origin}/projects/${projectId}?task=${task.id}`)}>Copy link</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirm(`Archive ${task.title}?`) && start(() => archiveTask(task.id, projectId))}><Archive className="mr-2 size-3.5" />Archive</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>{adding && <Composer projectId={projectId} parentTaskId={task.id} depth={depth + 1} onClose={() => setAdding(false)} />}{expanded && task.children.map((child) => <TaskRow key={child.id} task={child} projectId={projectId} depth={depth + 1} tags={tags} colors={colors} highlightedTaskId={highlightedTaskId} />)}</>;
}

function Composer({ projectId, parentTaskId = null, depth = 0, onClose }: { projectId: string; parentTaskId?: string | null; depth?: number; onClose: () => void }) { const [title, setTitle] = useState(""); const [pending, start] = useTransition(); const save = () => { if (!title.trim()) return; start(async () => { await createTask({ projectId, parentTaskId, title, description: "", status: "todo", priority: "none", dueDate: "", focusDate: "" }); onClose(); }); }; const controls = <div className="flex gap-2" style={{ paddingLeft: parentTaskId ? `${depth * 22 + 34}px` : undefined }}><Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") save(); if (event.key === "Escape") onClose(); }} placeholder={parentTaskId ? "Add a subtask…" : "Add a task…"} /><Button size="sm" disabled={pending || !title.trim()} onClick={save}>Add</Button><Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button></div>; return parentTaskId ? <tr className="border-b bg-muted/20"><td className="px-3 py-2" colSpan={8}>{controls}</td></tr> : <div className="rounded-lg border bg-muted/20 p-2">{controls}</div>; }
function CellSelect({ value, values, labels, color, onChange }: { value: string; values: readonly string[]; labels: Record<string, string>; color: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-28 border-0 px-1.5 py-1 text-xs font-medium shadow-none focus:ring-0" style={{ color, backgroundColor: `${color}18` }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((item) => (
          <SelectItem key={item} value={item} className="text-xs">
            {labels[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function DateCell({ value, onChange }: { value: string | null; onChange: (value: string) => void }) { return <input type="date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-28 bg-transparent text-xs outline-none" />; }
function TagCell({ task, projectId, available }: { task: TaskTreeNode; projectId: string; available: Tag[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const selected = new Set(task.tags.map((tag) => tag.id));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex max-w-36 flex-wrap gap-1 text-left outline-none">
          {task.tags.length ? (
            task.tags.map((tag) => (
              <span key={tag.id} className="rounded px-1.5 py-0.5 text-xs" style={{ color: tag.color, backgroundColor: `${tag.color}18` }}>
                {tag.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground hover:text-foreground">Add tag</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        <div className="max-h-48 overflow-auto space-y-1">
          {available.map((tag) => (
            <label key={tag.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted">
              <Checkbox
                checked={selected.has(tag.id)}
                disabled={pending}
                onCheckedChange={() => {
                  const ids = selected.has(tag.id) ? [...selected].filter((id) => id !== tag.id) : [...selected, tag.id];
                  start(() => setTaskTags(task.id, projectId, ids));
                }}
              />
              <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
function AttachmentCell({ task, projectId }: { task: TaskTreeNode; projectId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await upload(`tasks/${task.id}/${file.name}`, file, {
          access: "private",
          handleUploadUrl: "/api/tasks/upload",
          clientPayload: JSON.stringify({ taskId: task.id, fileName: file.name, fileSize: file.size })
        });
      }
      location.reload();
    } finally {
      setUploading(false);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input ref={input} type="file" multiple className="hidden" onChange={(event) => add(event.target.files)} />
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground outline-none">
          <Paperclip className="size-3.5" />
          {task.attachments.length || "Add"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <Button size="sm" variant="outline" className="w-full" disabled={uploading} onClick={() => input.current?.click()}>
          <Upload className="mr-2 size-3.5" />
          {uploading ? "Uploading..." : "Add files"}
        </Button>
        {task.attachments.length > 0 && (
          <div className="mt-2 space-y-1 border-t pt-2">
            {task.attachments.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-2 text-xs">
                <a className="truncate hover:underline text-muted-foreground hover:text-foreground" href={`/api/attachments/${file.id}/download`}>
                  {file.fileName}
                </a>
                <Button size="icon-sm" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={pending} onClick={() => start(() => removeTaskAttachment(file.id, projectId))}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
function PropertiesDialog({ open, onOpenChange, projectId, tags, colors }: { open: boolean; onOpenChange: (value: boolean) => void; projectId: string; tags: Tag[]; colors: Color[] }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("#64748b"); const [scope, setScope] = useState<"workspace" | "project">("project"); const [pending, start] = useTransition(); const savedColor = (property: "status" | "priority", value: string) => colors.find((item) => item.property === property && item.value === value)?.color ?? defaults[value];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Properties</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2">
            <p className="text-sm font-medium">Status colors</p>
            {taskStatuses.map((value) => (
              <ColorInput key={value} label={taskStatusLabels[value]} color={savedColor("status", value)} onChange={(next) => start(() => updatePropertyColor("status", value, next))} />
            ))}
            <p className="pt-2 text-sm font-medium">Priority colors</p>
            {priorities.filter((value) => value !== "none").map((value) => (
              <ColorInput key={value} label={priorityLabels[value]} color={savedColor("priority", value)} onChange={(next) => start(() => updatePropertyColor("priority", value, next))} />
            ))}
          </section>
          <section className="space-y-2">
            <p className="text-sm font-medium">Tags</p>
            <div className="flex gap-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New tag" />
              <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-8 w-8 cursor-pointer rounded border" />
              <Select value={scope} onValueChange={(value) => setScope(value as "workspace" | "project")}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project" className="text-xs">Project</SelectItem>
                  <SelectItem value="workspace" className="text-xs">Workspace</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!name.trim() || pending} onClick={() => start(async () => { await createTag({ name, color, projectId: scope === "project" ? projectId : null }); setName(""); })}>Add</Button>
            </div>
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                  <span className="text-xs text-muted-foreground">{tag.projectId ? "Project" : "Workspace"}</span>
                </span>
                <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => start(() => deleteTag(tag.id))}>Delete</Button>
              </div>
            ))}
          </section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function ColorInput({ label, color, onChange }: { label: string; color: string; onChange: (color: string) => void }) { return <label className="flex items-center justify-between text-sm"><span>{label}</span><input type="color" value={color} onChange={(event) => onChange(event.target.value)} className="h-6 w-6 cursor-pointer rounded border" /></label>; }
