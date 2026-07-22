import { FileText, Paperclip } from "lucide-react";
import { TaskService } from "@/services/task.service";
import { TaskListControls } from "@/features/tasks/task-list-controls";
import { SavedViews } from "@/features/tasks/saved-views";
import {
  getTaskViews,
  resolveTaskViewQuery,
} from "@/features/tasks/task-views";
import { requireUserId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const views = await getTaskViews(userId);
  const { query, selectedView } = resolveTaskViewQuery(params, views);
  const tasks = await TaskService.getDocumentInbox(userId, query);

  return (
    <section className="space-y-7">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Knowledge & files
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Document inbox
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every attachment across your active work, in one calm place.
        </p>
      </header>
      <div className="space-y-3">
        <SavedViews
          query={query}
          views={views}
          selectedViewId={selectedView?.id}
        />
        <TaskListControls query={query} />
      </div>
      {tasks.length ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_auto] gap-4 border-b bg-muted/45 px-5 py-3 text-xs font-medium text-muted-foreground">
            <span>Task</span>
            <span>Project</span>
            <span>Files</span>
          </div>
          {tasks.map((task) => (
            <a
              key={task.id}
              href={`/projects/${task.projectId}?task=${task.id}`}
              className="grid grid-cols-[1.4fr_1fr_auto] gap-4 border-b px-5 py-4 text-sm last:border-0 hover:bg-primary/4"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{task.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Open task workspace
                </span>
              </span>
              <span className="truncate text-muted-foreground">
                {task.projectName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <Paperclip className="size-3.5" />
                {task.attachmentCount}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-20 text-center shadow-sm">
          <FileText className="mx-auto mb-3 size-7 text-primary" />
          <h2 className="font-medium">No documents yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Attach a file to any task and it will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
