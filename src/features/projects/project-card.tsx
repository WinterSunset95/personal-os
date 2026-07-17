import Link from "next/link";
import { CalendarDays, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import type { ProjectSummary } from "./queries";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return <Link href={`/projects/${project.id}`} className="block"><Card className="h-full transition-shadow hover:shadow-sm"><CardHeader className="space-y-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-base">{project.name}</CardTitle><ProjectStatusBadge status={project.status} /></div><div className="flex gap-2"><PriorityBadge priority={project.priority} /></div></CardHeader>
    <CardContent className="space-y-4"><div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{project.progress}%</span></div><Progress value={project.progress} /></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" />{project.openTaskCount} open</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(project.dueDate)}</span></div></CardContent>
  </Card></Link>;
}
