"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { quickCaptureTask } from "@/features/projects/actions";

export function QuickCapture({ projects }: { projects: { id: string; name: string; isSystemInbox: boolean }[] }) {
  const [title, setTitle] = useState(""); const [projectId, setProjectId] = useState(""); const [pending, startTransition] = useTransition();
  const submit = () => { if (!title.trim()) return; startTransition(async () => { await quickCaptureTask(title, projectId || undefined); setTitle(""); setProjectId(""); }); };
  return <section className="rounded-xl border bg-background p-4"><div className="mb-3"><h2 className="text-base font-semibold">Quick Capture</h2><p className="text-sm text-muted-foreground">Capture a thought without leaving the dashboard.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="What needs doing?" aria-label="Quick capture task title" /><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">Inbox</option>{projects.filter((project) => !project.isSystemInbox).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><Button type="button" disabled={pending || !title.trim()} onClick={submit}><Plus className="size-4" />Add</Button></div></section>;
}
