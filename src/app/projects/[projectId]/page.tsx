import { notFound } from "next/navigation";
import { Archive, CalendarDays, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import { archiveProject } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/project-form";
import { getProjectDetail } from "@/features/projects/queries";
import { TaskForm } from "@/features/tasks/task-form";
import { TaskTree } from "@/features/tasks/task-tree";
export const dynamic = "force-dynamic";
export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const detail = await getProjectDetail(projectId); if (!detail) notFound(); const { project, taskTree } = detail; return <section className="space-y-10"><header className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-2"><ProjectStatusBadge status={project.status} /><PriorityBadge priority={project.priority} /></div><h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>{project.description && <p className="mt-2 max-w-2xl text-muted-foreground">{project.description}</p>}</div><div className="flex gap-2"><ProjectForm project={project} /><form action={archiveProject.bind(null, project.id)}><Button type="submit" variant="outline"><Archive className="size-4" />Archive</Button></form></div></div><div className="grid gap-4 rounded-xl border bg-background p-5 sm:grid-cols-3"><div className="sm:col-span-1"><div className="flex justify-between text-sm"><span>Progress</span><span>{project.progress}%</span></div><Progress className="mt-3" value={project.progress} /></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><ListChecks className="size-4" />{project.openTaskCount} open tasks</div><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" />{formatDate(project.dueDate)}</div></div></header><div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Tasks</h2><p className="text-sm text-muted-foreground">Finish the next meaningful step.</p></div><TaskForm projectId={project.id} /></div><TaskTree projectId={project.id} tasks={taskTree} /></div></section>; }
