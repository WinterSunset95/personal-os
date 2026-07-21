import { TaskViewRepository } from "@/repositories/task-view.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { DbClient } from "@/db";
import { z } from "zod";
import { taskViewInputSchema } from "@/domain/task/views";

async function ensureActiveProject(projectId: string, tx?: DbClient) {
  const project = await ProjectRepository.findActiveById(projectId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TaskViewService = {
  async getTaskViews(projectId?: string) {
    return TaskViewRepository.findViews(projectId ?? null);
  },

  async findViewFirst(viewId: string) {
    return TaskViewRepository.findViewFirst(viewId);
  },

  async createTaskView(input: z.input<typeof taskViewInputSchema>) {
    const value = taskViewInputSchema.parse(input);
    if (value.projectId) {
      await ensureActiveProject(value.projectId);
    }
    return TaskViewRepository.createView(value);
  },

  async updateTaskView(
    viewId: string,
    input: z.input<typeof taskViewInputSchema>,
  ) {
    const value = taskViewInputSchema.parse(input);
    const existing = await TaskViewRepository.findViewFirst(viewId);
    if (!existing) throw new Error("Saved view is unavailable.");
    if (existing.projectId !== value.projectId)
      throw new Error("Saved view scope cannot be changed.");
    if (value.projectId) {
      await ensureActiveProject(value.projectId);
    }
    await TaskViewRepository.updateView(viewId, {
      name: value.name,
      query: value.query,
    });
    return { viewId, projectId: value.projectId };
  },

  async deleteTaskView(viewId: string) {
    const existing = await TaskViewRepository.findViewFirst(viewId);
    if (!existing) return null;
    await TaskViewRepository.deleteView(viewId);
    return existing.projectId;
  },
};
