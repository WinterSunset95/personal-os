import { TaskService } from "@/services/task.service";
import { taskQuerySchema } from "@/domain/task/query";
import { builtInTaskViews, type TaskViewOption } from "@/domain/task/views";

export { builtInTaskViews, findTaskView, resolveTaskViewQuery, type TaskViewOption } from "@/domain/task/views";

export async function getTaskViews(projectId?: string): Promise<TaskViewOption[]> {
  const customViews = await TaskService.getTaskViews(projectId);
  return [
    ...builtInTaskViews.map((view) => ({ ...view, projectId: null, builtIn: true })),
    ...customViews.map((view: any) => ({ ...view, query: taskQuerySchema.parse(view.query), builtIn: false })),
  ];
}

