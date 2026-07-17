import { FolderPlus } from "lucide-react";
import { ProjectCard } from "@/features/projects/project-card";
import { ProjectForm } from "@/features/projects/project-form";
import { getProjectSummaries } from "@/features/projects/queries";
export const dynamic = "force-dynamic";
export default async function ProjectsPage() { const projects = await getProjectSummaries(); return <section className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Workspace</p><h1 className="text-3xl font-semibold tracking-tight">Projects</h1></div><ProjectForm /></div>{projects.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="rounded-xl border border-dashed bg-background px-6 py-20 text-center"><FolderPlus className="mx-auto mb-3 size-6 text-muted-foreground" /><h2 className="font-medium">Start with a project</h2><p className="mt-1 text-sm text-muted-foreground">A project gives the next few tasks a home.</p><div className="mt-5"><ProjectForm /></div></div>}</section>; }
