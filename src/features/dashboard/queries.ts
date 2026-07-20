import { TaskService } from "@/services/task.service";
import type { TaskQuery } from "@/features/tasks/task-query";

export async function getDashboardData(query?: TaskQuery) {
  return TaskService.getDashboardData(query);
}
