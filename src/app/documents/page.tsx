import { FileText, Paperclip } from "lucide-react";
import { getDocumentInbox } from "@/features/projects/queries";
import { TaskListControls } from "@/features/tasks/task-list-controls";
import { parseTaskQuery } from "@/features/tasks/task-query";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseTaskQuery(await searchParams); const tasks = await getDocumentInbox(query);
  return <section className="space-y-8"><div><p className="text-sm text-muted-foreground">Attached task files</p><h1 className="text-3xl font-semibold tracking-tight">Document Inbox</h1></div><TaskListControls query={query} />{tasks.length ? <div className="divide-y rounded-xl border bg-background">{tasks.map((task) => <a key={task.id} href={`/projects/${task.projectId}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-muted/40"><div className="min-w-0"><p className="truncate font-medium">{task.title}</p><p className="text-sm text-muted-foreground">{task.projectName}</p></div><span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground"><Paperclip className="size-4" />{task.attachmentCount}</span></a>)}</div> : <div className="rounded-xl border border-dashed bg-background px-6 py-20 text-center"><FileText className="mx-auto mb-3 size-6 text-muted-foreground" /><h2 className="font-medium">No documents yet</h2><p className="mt-1 text-sm text-muted-foreground">Attach a file to any task and it will appear here.</p></div>}</section>;
}
