import { TaskViewRepository } from "@/repositories/task-view.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { DbClient } from "@/db";
import { z } from "zod";
import { taskViewInputSchema } from "@/domain/task/views";

async function ensureActiveProject(projectId: string, userId: string, tx?: DbClient) {
  const project = await ProjectRepository.findActiveById(projectId, userId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TaskViewService = {
  async getTaskViews(userId: string, projectId?: string) {
    return TaskViewRepository.findViews(projectId ?? null, userId);
  },

  async findViewFirst(userId: string, viewId: string) {
    return TaskViewRepository.findViewFirst(viewId, userId);
  },

  async createTaskView(userId: string, input: z.input<typeof taskViewInputSchema>) {
    const value = taskViewInputSchema.parse(input);
    if (value.projectId) {
      await ensureActiveProject(value.projectId, userId);
    }
    return TaskViewRepository.createView({ ...value, userId });
  },

  async updateTaskView(
    userId: string,
    viewId: string,
    input: z.input<typeof taskViewInputSchema>,
  ) {
    const value = taskViewInputSchema.parse(input);
    const existing = await TaskViewRepository.findViewFirst(viewId, userId);
    if (!existing) throw new Error("Saved view is unavailable.");
    if (existing.projectId !== value.projectId)
      throw new Error("Saved view scope cannot be changed.");
    if (value.projectId) {
      await ensureActiveProject(value.projectId, userId);
    }
    await TaskViewRepository.updateView(viewId, userId, {
      name: value.name,
      query: value.query,
    });
    return { viewId, projectId: value.projectId };
  },

  async deleteTaskView(userId: string, viewId: string) {
    const existing = await TaskViewRepository.findViewFirst(viewId, userId);
    if (!existing) return null;
    await TaskViewRepository.deleteView(viewId, userId);
    return existing.projectId;
  },
};
