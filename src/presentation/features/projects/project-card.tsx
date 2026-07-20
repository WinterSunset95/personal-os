import Link from "next/link";
import { CalendarDays, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import type { ProjectSummary } from "@/services/project.service";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return <Link href={`/projects/${project.id}`} className="block"><Card className="h-full border-border/80 bg-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"><CardHeader className="space-y-4"><div className="flex items-start justify-between gap-3"><CardTitle className="text-base font-semibold tracking-tight">{project.name}</CardTitle><ProjectStatusBadge status={project.status} /></div><div className="flex gap-2"><PriorityBadge priority={project.priority} /></div></CardHeader>
    <CardContent className="space-y-4"><div className="rounded-lg bg-muted/55 p-3"><div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span className="font-medium text-foreground">{project.progress}%</span></div><Progress className="mt-2 h-1.5" value={project.progress} /></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><ListChecks className="size-3.5 text-primary" />{project.openTaskCount} open</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5 text-primary" />{formatDate(project.dueDate)}</span></div></CardContent>
  </Card></Link>;
}
