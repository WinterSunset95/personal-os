import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import { getDashboardData } from "@/features/dashboard/queries";
import { QuickCapture } from "@/features/dashboard/quick-capture";
import { ProjectCard } from "@/features/projects/project-card";
import { TaskListControls } from "@/features/tasks/task-list-controls";
import { SavedViews } from "@/features/tasks/saved-views";
import { getTaskViews, resolveTaskViewQuery } from "@/features/tasks/task-views";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const views = await getTaskViews();
  const { query, selectedView } = resolveTaskViewQuery(params, views);
  const data = await getDashboardData(query);
  return <section className="space-y-8"><div><p className="text-sm text-muted-foreground">Personal workspace</p><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1></div><QuickCapture projects={data.activeProjects} /><SavedViews query={query} views={views} selectedViewId={selectedView?.id} /><TaskListControls query={query} /><div className="grid gap-4 lg:grid-cols-2"><DashboardList title="Today’s Focus" icon={CalendarDays} empty="Nothing scheduled or focused for today.">{data.focusTasks.map((task) => <TaskLink key={task.id} href={`/projects/${task.projectId}`} title={task.title} detail={task.source} />)}</DashboardList><DashboardList title="High Priority Tasks" icon={CheckCircle2} empty="No high-priority tasks right now.">{data.highPriorityTasks.map((task) => <TaskLink key={task.id} href={`/projects/${task.projectId}`} title={task.title} detail={task.dueDate ? formatDate(task.dueDate) : "No due date"} />)}</DashboardList><DashboardList title="Waiting On" icon={Hourglass} empty="Nothing is waiting on someone else.">{data.waitingTasks.map((task) => <TaskLink key={task.id} href={`/projects/${task.projectId}`} title={task.title} detail={task.dueDate ? formatDate(task.dueDate) : "No due date"} />)}</DashboardList></div><div><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Active Projects</h2><Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">View all</Link></div>{data.activeProjects.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.activeProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <Empty text="No active projects yet." />}</div><DashboardList title="Recently Updated" icon={Clock3} empty="Your recent work will appear here.">{data.recent.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-muted-foreground"><span className="truncate">{item.label}</span><span className="shrink-0 text-xs text-muted-foreground">{item.type}</span></Link>)}</DashboardList></section>;
}

function DashboardList({ title, icon: Icon, empty, children }: { title: string; icon: typeof CalendarDays; empty: string; children: React.ReactNode }) { return <Card><CardHeader className="flex-row items-center gap-2 space-y-0"><Icon className="size-4 text-muted-foreground" /><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children ? <div className="divide-y">{children}</div> : <p className="py-3 text-sm text-muted-foreground">{empty}</p>}</CardContent></Card>; }
function TaskLink({ href, title, detail }: { href: string; title: string; detail: string }) { return <Link href={href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-muted-foreground"><span className="truncate font-medium">{title}</span><span className="shrink-0 text-xs text-muted-foreground">{detail}</span></Link>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed bg-background px-5 py-10 text-center text-sm text-muted-foreground">{text}</div>; }
