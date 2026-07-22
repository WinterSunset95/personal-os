import { TaskRepository } from "@/repositories/task.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { TagRepository } from "@/repositories/tag.repository";
import { TaskViewRepository } from "@/repositories/task-view.repository";
import { PropertyColorRepository } from "@/repositories/property-color.repository";
import { ProjectService, type ProjectSummary } from "./project.service";
import { DbClient } from "@/db";
import { tasks, projects, tags } from "@/db/schema";
import { z } from "zod";
import { taskInputSchema } from "@/domain/task/validation";
import { tagInputSchema, colorInputSchema } from "@/domain/tag/validation";
import { taskViewInputSchema } from "@/domain/task/views";
import { descendantIds, type TaskRecord, type TaskTagRecord, type TaskAttachmentRecord } from "@/domain/task/tree";
import { priorities, taskStatuses } from "@/domain/task/types";
import {
  defaultTaskQuery,
  matchesTask,
  sortTasks,
  type TaskQuery,
} from "@/domain/task/query";
import { todayIso } from "@/lib/date";
import { optionalDate } from "@/domain/shared/validation";

type TaskDbRow = typeof tasks.$inferSelect;
type ProjectDbRow = typeof projects.$inferSelect;
type TagDbRow = typeof tags.$inferSelect;

async function ensureActiveProject(projectId: string, userId: string, tx?: DbClient) {
  const project = await ProjectRepository.findActiveById(projectId, userId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TaskService = {
  async findTaskById(id: string, userId: string) {
    return TaskRepository.findById(id, userId);
  },

  async quickCaptureTask(userId: string, title: string, projectId?: string) {
    const trimmedTitle = z
      .string()
      .trim()
      .min(1, "Task title is required.")
      .max(160)
      .parse(title);
    const project = projectId
      ? await ProjectRepository.findActiveById(projectId, userId)
      : await ProjectService.getOrCreateInbox(userId);
    if (!project) throw new Error("The selected project is unavailable.");
    const lastOrder = await TaskRepository.getMaxOrder(project.id, null, userId);
    const task = await TaskRepository.create({
      userId,
      projectId: project.id,
      parentTaskId: null,
      title: trimmedTitle,
      description: null,
      status: "todo",
      priority: "none",
      dueDate: null,
      focusDate: null,
      order: lastOrder + 1,
      archivedAt: null,
    });
    return { taskId: task.id, projectId: project.id };
  },

  async createTask(userId: string, input: z.input<typeof taskInputSchema>) {
    const value = taskInputSchema.parse(input);
    await ensureActiveProject(value.projectId, userId);
    if (value.parentTaskId) {
      const parent = await TaskRepository.findActiveById(
        value.parentTaskId,
        value.projectId,
        userId,
      );
      if (!parent)
        throw new Error(
          "A subtask must belong to an active task in the same project.",
        );
    }
    const lastOrder = await TaskRepository.getMaxOrder(
      value.projectId,
      value.parentTaskId,
      userId,
    );
    const task = await TaskRepository.create({
      ...value,
      userId,
      order: lastOrder + 1,
      archivedAt: null,
    });
    return { taskId: task.id, projectId: value.projectId };
  },

  async updateTask(userId: string, taskId: string, input: z.input<typeof taskInputSchema>) {
    const value = taskInputSchema.parse(input);
    const task = await TaskRepository.findActiveById(taskId, value.projectId, userId);
    if (!task) throw new Error("The task is unavailable.");
    await TaskRepository.update(taskId, userId, {
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      focusDate: value.focusDate,
    });
    return { taskId, projectId: value.projectId };
  },

  async toggleTaskCompletion(
    userId: string,
    taskId: string,
    projectId: string,
    completed: boolean,
  ) {
    await TaskRepository.update(taskId, userId, {
      status: completed ? "completed" : "todo",
    });
    return { taskId, projectId };
  },

  async archiveTask(userId: string, taskId: string, projectId: string) {
    const allTasks = await TaskRepository.findAllByProject(projectId, userId);
    const ids = descendantIds(taskId, allTasks);
    if (!ids.length) return { projectId };
    await TaskRepository.archiveMany(ids, userId);
    return { projectId };
  },

  async restoreTask(userId: string, taskId: string, projectId: string) {
    await ensureActiveProject(projectId, userId);
    const allTasks = await TaskRepository.findAllByProject(projectId, userId);
    const byId = new Map<string, TaskDbRow>(allTasks.map((task: TaskDbRow) => [task.id, task]));
    const ids = new Set<string>(descendantIds(taskId, allTasks));
    let current: TaskDbRow | undefined = byId.get(taskId);
    while (current?.parentTaskId) {
      ids.add(current.parentTaskId);
      current = byId.get(current.parentTaskId);
    }
    await TaskRepository.restoreMany([...ids], userId);
    return { projectId };
  },

  async duplicateTask(userId: string, taskId: string, projectId: string) {
    const task = await TaskRepository.findActiveById(taskId, projectId, userId);
    if (!task) throw new Error("Task is unavailable.");
    return this.createTask(userId, {
      projectId,
      parentTaskId: task.parentTaskId,
      title: `${task.title} copy`,
      description: task.description ?? "",
      status: "todo",
      priority: task.priority,
      dueDate: task.dueDate ?? "",
      focusDate: task.focusDate ?? "",
    });
  },

  async updateTaskProperty(
    userId: string,
    taskId: string,
    projectId: string,
    property: "status" | "priority" | "dueDate" | "focusDate",
    value: string,
  ) {
    await ensureActiveProject(projectId, userId);
    if (property === "status") {
      await TaskRepository.update(taskId, userId, {
        status: z.enum(taskStatuses).parse(value),
      });
    } else if (property === "priority") {
      await TaskRepository.update(taskId, userId, {
        priority: z.enum(priorities).parse(value),
      });
    } else if (property === "dueDate" || property === "focusDate") {
      await TaskRepository.update(taskId, userId, {
        [property]: optionalDate.parse(value),
      });
    }
    return { taskId, projectId };
  },

  async updatePropertyColor(
    userId: string,
    property: "status" | "priority",
    value: string,
    color: string,
  ) {
    colorInputSchema.parse(color);
    const allowed = property === "status" ? taskStatuses : priorities;
    if (!allowed.includes(value as never))
      throw new Error("Unknown property value.");
    await PropertyColorRepository.updatePropertyColor(userId, property, value, color);
  },

  async createTag(userId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    if (value.projectId) await ensureActiveProject(value.projectId, userId);
    const tag = await TagRepository.create({ ...value, userId });
    return tag;
  },

  async updateTag(userId: string, tagId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    await TagRepository.update(tagId, userId, value);
    return tagId;
  },

  async deleteTag(userId: string, tagId: string) {
    const tag = await TagRepository.findById(tagId, userId);
    if (!tag) return null;
    await TagRepository.delete(tagId, userId);
    return tag.projectId ?? undefined;
  },

  async setTaskTags(userId: string, taskId: string, projectId: string, tagIds: string[]) {
    const ids = z.array(z.string().uuid()).max(20).parse(tagIds);
    await ensureActiveProject(projectId, userId);
    const available = await TagRepository.findTagsByIds(ids, userId);
    if (
      available.some(
        (tag: TagDbRow) => tag.projectId && tag.projectId !== projectId,
      ) ||
      available.length !== ids.length
    ) {
      throw new Error("A tag is unavailable for this project.");
    }
    await TagRepository.setTaskTags(taskId, ids);
    return { taskId, projectId };
  },

  async getTaskTableSettings(userId: string, projectId: string) {
    const [availableTags, colors] = await Promise.all([
      TagRepository.findAllForProjectSettings(projectId, userId),
      PropertyColorRepository.findPropertyColors(userId),
    ]);
    return { availableTags, colors };
  },

  async getDocumentInbox(userId: string, query: TaskQuery = defaultTaskQuery) {
    const today = todayIso();
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(userId),
      ProjectRepository.findAllActive(userId),
    ]);
    const documents = sortTasks(
      (await ProjectService.withAttachmentCounts(userId, taskRows)).filter(
        (task: TaskRecord) =>
          task.attachmentCount > 0 && matchesTask(task, query, today),
      ),
      query,
    );
    const projectNames = new Map<string, string>(
      projectRows.map((project: ProjectDbRow) => [project.id, project.name]),
    );
    return documents.map((task: TaskRecord) => ({
      ...task,
      projectName: projectNames.get(task.projectId) ?? "Archived project",
    }));
  },

  async getDashboardData(userId: string, query: TaskQuery = defaultTaskQuery) {
    const today = todayIso();
    const [taskRows, activeProjects, recentProjects] = await Promise.all([
      TaskRepository.findAllActive(userId),
      ProjectService.getProjectSummaries(userId),
      ProjectRepository.findAllActive(userId),
    ]);
    const sortedRecentProjects = [...recentProjects]
      .sort((a: ProjectDbRow, b: ProjectDbRow) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 6);

    const visibleTasks = sortTasks(
      (await ProjectService.withAttachmentCounts(userId, taskRows)).filter(
        (task: TaskRecord) => matchesTask(task, query, today),
      ),
      query,
    );
    const focusTasks = visibleTasks
      .filter(
        (task: TaskRecord) =>
          task.status !== "completed" &&
          (task.dueDate === today || task.focusDate === today),
      )
      .slice(0, 6);
    const highPriorityTasks = visibleTasks
      .filter(
        (task: TaskRecord) => task.status !== "completed" && task.priority === "high",
      )
      .slice(0, 6);
    const waitingTasks = visibleTasks
      .filter((task: TaskRecord) => task.status === "waiting")
      .slice(0, 6);
    const recentTasks = [...visibleTasks]
      .sort((a: TaskRecord, b: TaskRecord) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 6);

    return {
      focusTasks: focusTasks.map((task: TaskRecord) => ({
        ...task,
        source:
          task.dueDate === today && task.focusDate === today
            ? "Due today · Focused"
            : task.dueDate === today
              ? "Due today"
              : "Focused",
      })),
      highPriorityTasks,
      waitingTasks,
      activeProjects: activeProjects
        .filter((project: ProjectSummary) => project.status === "active")
        .slice(0, 6),
      recent: [
        ...sortedRecentProjects.map((project: ProjectDbRow) => ({
          id: project.id,
          label: project.name,
          type: "Project" as const,
          updatedAt: project.updatedAt,
          href: `/projects/${project.id}`,
        })),
        ...recentTasks.map((task: TaskRecord) => ({
          id: task.id,
          label: task.title,
          type: "Task" as const,
          updatedAt: task.updatedAt,
          href: `/projects/${task.projectId}`,
        })),
      ]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 6),
    };
  },

  async searchTasks(userId: string, term: string) {
    const query = z.string().trim().min(1).max(100).parse(term).toLowerCase();
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(userId),
      ProjectRepository.findAllActive(userId),
    ]);
    const projectMap = new Map<string, ProjectDbRow>(
      projectRows.map((p: ProjectDbRow) => [p.id, p]),
    );
    const activeTasks = taskRows.filter((task: TaskDbRow) =>
      projectMap.has(task.projectId),
    );
    const taskRowsWithAttachments =
      await ProjectService.withAttachmentCounts(userId, activeTasks);

    return taskRowsWithAttachments
      .filter((task: TaskRecord) => {
        const projectName = projectMap.get(task.projectId)?.name ?? "";
        return [
          task.title,
          task.description ?? "",
          projectName,
          ...task.tags.map((tag: TaskTagRecord) => tag.name),
          ...task.attachments.map((file: TaskAttachmentRecord) => file.fileName),
        ].some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 20)
      .map((task: TaskRecord) => {
        const projectName = projectMap.get(task.projectId)?.name ?? "";
        return {
          id: task.id,
          title: task.title,
          projectId: task.projectId,
          projectName,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
        };
      });
  },

  // Task Views
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
