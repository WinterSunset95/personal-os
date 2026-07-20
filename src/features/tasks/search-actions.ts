"use server";

import { TaskService } from "@/services/task.service";

export async function searchTasks(term: string) {
  return TaskService.searchTasks(term);
}
