import { TaskViewService } from "@/services/task-view.service";
import { taskQuerySchema } from "@/domain/task/query";
import { builtInTaskViews, type TaskViewOption } from "@/domain/task/views";
import { taskViews } from "@/db/schema";

export {
  builtInTaskViews,
  findTaskView,
  resolveTaskViewQuery,
  type TaskViewOption,
} from "@/domain/task/views";

type TaskViewDbRow = typeof taskViews.$inferSelect;

export async function getTaskViews(
  projectId?: string,
): Promise<TaskViewOption[]> {
  const customViews = await TaskViewService.getTaskViews(projectId);
  return [
    ...builtInTaskViews.map((view) => ({
      ...view,
      projectId: null,
      builtIn: true,
    })),
    ...customViews.map((view: TaskViewDbRow) => ({
      ...view,
      query: taskQuerySchema.parse(view.query),
      builtIn: false,
    })),
  ];
}
