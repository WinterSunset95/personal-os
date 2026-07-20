import { db } from "@/db";
import { ProjectRepository } from "@/repositories/project.repository";
import { TaskRepository } from "@/repositories/task.repository";
import { AttachmentRepository } from "@/repositories/attachment.repository";
import { TagRepository } from "@/repositories/tag.repository";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { projectInputSchema } from "@/domain/project/validation";
import { toTaskTree, type TaskRecord } from "@/domain/task/tree";
import { defaultTaskQuery, filterTaskTree, hasTaskFilters, type TaskQuery } from "@/domain/task/query";

export type ProjectSummary = Awaited<ReturnType<typeof ProjectRepository.findById>> & { openTaskCount: number; progress: number };

function refresh(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/archive");
  revalidatePath("/documents");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export const ProjectService = {
  async createProject(input: z.input<typeof projectInputSchema>) {
    const value = projectInputSchema.parse(input);
    const project = await ProjectRepository.create(value);
    refresh(project.id);
    return project.id;
  },

  async updateProject(projectId: string, input: z.input<typeof projectInputSchema>) {
    const value = projectInputSchema.parse(input);
    await ProjectRepository.update(projectId, value);
    refresh(projectId);
  },

  async archiveProject(projectId: string) {
    const project = await ProjectRepository.findById(projectId);
    if (project?.isSystemInbox) throw new Error("The System Inbox cannot be archived.");
    const now = new Date();
    await db.transaction(async (tx) => {
      await ProjectRepository.archive(projectId, now, tx);
      const tasks = await TaskRepository.findAllByProject(projectId, tx);
      await TaskRepository.archiveMany(tasks.map(t => t.id), now, tx);
    });
    refresh(projectId);
  },

  async restoreProject(projectId: string) {
    await db.transaction(async (tx) => {
      await ProjectRepository.restore(projectId, tx);
      const tasks = await TaskRepository.findAllByProject(projectId, tx);
      await TaskRepository.restoreMany(tasks.map(t => t.id), tx);
    });
    refresh(projectId);
  },

  async getOrCreateInbox(tx = db) {
    const existing = await ProjectRepository.findSystemInbox(tx);
    if (existing) return existing;
    return ProjectRepository.create({
      name: "Inbox",
      description: "Quickly captured tasks.",
      status: "active",
      priority: "none",
      isSystemInbox: true,
    }, tx);
  },

  async withAttachmentCounts(taskRows: any[], tx = db) {
    if (!taskRows.length) return [] as TaskRecord[];
    const [attachments, tagRows] = await Promise.all([
      AttachmentRepository.findAll(tx),
      TagRepository.findTagsForTasks(taskRows.map((task) => task.id), tx),
    ]);
    const counts = new Map<string, number>();
    attachments.forEach(({ taskId }) => counts.set(taskId, (counts.get(taskId) ?? 0) + 1));
    return taskRows.map((task) => ({
      ...task,
      attachmentCount: counts.get(task.id) ?? 0,
      attachments: attachments
        .filter((attachment) => attachment.taskId === task.id)
        .map(({ id, fileName, contentType, size, createdAt }) => ({ id, fileName, contentType, size, createdAt })),
      tags: tagRows.filter((tag) => tag.taskId === task.id).map((tag) => ({ id: tag.id, name: tag.name, color: tag.color, projectId: tag.projectId }))
    }));
  },

  summarize(project: any, projectTasks: TaskRecord[]): ProjectSummary {
    const active = projectTasks.filter((task) => !task.archivedAt);
    const completed = active.filter((task) => task.status === "completed").length;
    return {
      ...project,
      openTaskCount: active.filter((task) => task.status !== "completed").length,
      progress: active.length ? Math.round((completed / active.length) * 100) : 0
    };
  },

  async getProjectSummaries() {
    const [projectRows, taskRows] = await Promise.all([
      ProjectRepository.findAllActive(),
      TaskRepository.findAllActive(),
    ]);
    const tasksWithAttachments = await this.withAttachmentCounts(taskRows);
    return projectRows.map((project) => this.summarize(project, tasksWithAttachments.filter((task) => task.projectId === project.id)));
  },

  async getProjectDetail(projectId: string, query: TaskQuery = defaultTaskQuery) {
    const project = await ProjectRepository.findActiveById(projectId);
    if (!project) return null;
    const taskRows = await TaskRepository.findAllActiveByProject(projectId);
    const tasksWithAttachments = await this.withAttachmentCounts(taskRows);
    const taskTree = toTaskTree(tasksWithAttachments, query);
    return {
      project: this.summarize(project, tasksWithAttachments),
      taskTree: hasTaskFilters(query) ? filterTaskTree(taskTree, query) : taskTree
    };
  },

  async getArchivedProjects() {
    const [archivedProjects, archivedTasks] = await Promise.all([
      ProjectRepository.findAllArchived(),
      TaskRepository.findAllArchived(),
    ]);
    return { archivedProjects, archivedTasks };
  }
};
