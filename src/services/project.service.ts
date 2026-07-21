import { ProjectRepository } from "@/repositories/project.repository";
import { TaskRepository } from "@/repositories/task.repository";
import { AttachmentRepository } from "@/repositories/attachment.repository";
import { TagRepository } from "@/repositories/tag.repository";
import { TransactionRepository } from "@/repositories/transaction.repository";
import { DbClient } from "@/db";
import { tasks, projects, taskAttachments, tags } from "@/db/schema";
import { z } from "zod";
import { projectInputSchema } from "@/domain/project/validation";
import { toTaskTree, type TaskRecord } from "@/domain/task/tree";
import {
  defaultTaskQuery,
  filterTaskTree,
  hasTaskFilters,
  type TaskQuery,
} from "@/domain/task/query";
import {
  summarizeProject,
  canArchiveProject,
  type ProjectSummary,
} from "@/domain/project/logic";

export type { ProjectSummary };

type TaskDbRow = typeof tasks.$inferSelect;
type ProjectDbRow = typeof projects.$inferSelect;
type AttachmentDbRow = typeof taskAttachments.$inferSelect;
type TagDbRow = typeof tags.$inferSelect;

export const ProjectService = {
  async createProject(input: z.input<typeof projectInputSchema>) {
    const value = projectInputSchema.parse(input);
    const project = await ProjectRepository.create(value);
    return project.id;
  },

  async updateProject(
    projectId: string,
    input: z.input<typeof projectInputSchema>,
  ) {
    const value = projectInputSchema.parse(input);
    await ProjectRepository.update(projectId, value);
    return projectId;
  },

  async archiveProject(projectId: string) {
    const project = await ProjectRepository.findById(projectId);
    if (!canArchiveProject(project))
      throw new Error("The System Inbox cannot be archived.");
    const now = new Date();
    await TransactionRepository.runTransaction(async (tx) => {
      await ProjectRepository.archive(projectId, now, tx);
      const projectTasks = await TaskRepository.findAllByProject(projectId, tx);
      await TaskRepository.archiveMany(
        projectTasks.map((t: TaskDbRow) => t.id),
        now,
        tx,
      );
    });
    return projectId;
  },

  async restoreProject(projectId: string) {
    await TransactionRepository.runTransaction(async (tx) => {
      await ProjectRepository.restore(projectId, tx);
      const projectTasks = await TaskRepository.findAllByProject(projectId, tx);
      await TaskRepository.restoreMany(
        projectTasks.map((t: TaskDbRow) => t.id),
        tx,
      );
    });
    return projectId;
  },

  async getOrCreateInbox(tx?: DbClient) {
    const existing = await ProjectRepository.findSystemInbox(tx);
    if (existing) return existing;
    return ProjectRepository.create(
      {
        name: "Inbox",
        description: "Quickly captured tasks.",
        status: "active",
        priority: "none",
        isSystemInbox: true,
      },
      tx,
    );
  },

  async withAttachmentCounts(taskRows: TaskDbRow[], tx?: DbClient): Promise<TaskRecord[]> {
    if (!taskRows.length) return [];
    const [attachments, tagRows] = await Promise.all([
      AttachmentRepository.findAll(tx),
      TagRepository.findTagsForTasks(
        taskRows.map((task: TaskDbRow) => task.id),
        tx,
      ),
    ]);
    const counts = new Map<string, number>();
    attachments.forEach(({ taskId }: { taskId: string }) =>
      counts.set(taskId, (counts.get(taskId) ?? 0) + 1),
    );
    return taskRows.map((task: TaskDbRow) => ({
      ...task,
      attachmentCount: counts.get(task.id) ?? 0,
      attachments: attachments
        .filter((attachment: AttachmentDbRow) => attachment.taskId === task.id)
        .map(({ id, fileName, contentType, size, createdAt }: AttachmentDbRow) => ({
          id,
          fileName,
          contentType,
          size,
          createdAt,
        })),
      tags: tagRows
        .filter((tag: TagDbRow & { taskId: string }) => tag.taskId === task.id)
        .map((tag: TagDbRow & { taskId: string }) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          projectId: tag.projectId,
        })),
    }));
  },

  async getProjectSummaries(): Promise<ProjectSummary[]> {
    const [projectRows, taskRows] = await Promise.all([
      ProjectRepository.findAllActive(),
      TaskRepository.findAllActive(),
    ]);
    const tasksWithAttachments = await this.withAttachmentCounts(taskRows);
    return projectRows.map((project: ProjectDbRow) =>
      summarizeProject(
        project,
        tasksWithAttachments.filter((task) => task.projectId === project.id),
      ),
    );
  },

  async getProjectDetail(
    projectId: string,
    query: TaskQuery = defaultTaskQuery,
  ) {
    const project = await ProjectRepository.findActiveById(projectId);
    if (!project) return null;
    const taskRows = await TaskRepository.findAllActiveByProject(projectId);
    const tasksWithAttachments = await this.withAttachmentCounts(taskRows);
    const taskTree = toTaskTree(tasksWithAttachments, query);
    return {
      project: summarizeProject(project, tasksWithAttachments),
      taskTree: hasTaskFilters(query)
        ? filterTaskTree(taskTree, query)
        : taskTree,
    };
  },

  async getArchivedProjects() {
    const [archivedProjects, archivedTasks] = await Promise.all([
      ProjectRepository.findAllArchived(),
      TaskRepository.findAllArchived(),
    ]);
    return { archivedProjects, archivedTasks };
  },
};
