"use client";

import { useState, useTransition } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { quickCaptureTask } from "@/features/projects/actions";

export function QuickCapture({ projects }: { projects: { id: string; name: string; isSystemInbox: boolean }[] }) {
  const [title, setTitle] = useState(""); const [projectId, setProjectId] = useState(""); const [pending, startTransition] = useTransition();
  const submit = () => { if (!title.trim()) return; startTransition(async () => { await quickCaptureTask(title, projectId || undefined); setTitle(""); setProjectId(""); }); };
  return <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span><div><h2 className="font-semibold tracking-tight">Quick capture</h2><p className="text-sm text-muted-foreground">Turn a thought into an action before it disappears.</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><Input className="h-10 border-0 bg-muted/65 shadow-none focus-visible:ring-1" value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="What needs doing?" aria-label="Quick capture task title" /><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="">Inbox</option>{projects.filter((project) => !project.isSystemInbox).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><Button className="h-10" type="button" disabled={pending || !title.trim()} onClick={submit}><Plus className="size-4" />Add task</Button></div></section>;
}
