import { TaskRepository } from "@/repositories/task.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { TagRepository } from "@/repositories/tag.repository";
import { TaskViewRepository } from "@/repositories/task-view.repository";
import { PropertyColorRepository } from "@/repositories/property-color.repository";
import { ProjectService } from "./project.service";
import { z } from "zod";
import { taskInputSchema } from "@/domain/task/validation";
import { tagInputSchema, colorInputSchema } from "@/domain/tag/validation";
import { taskViewInputSchema } from "@/domain/task/views";
import { descendantIds, type TaskRecord } from "@/domain/task/tree";
import { priorities, taskStatuses } from "@/domain/task/types";
import { defaultTaskQuery, matchesTask, sortTasks, type TaskQuery } from "@/domain/task/query";
import { todayIso } from "@/lib/date";
import { optionalDate } from "@/domain/shared/validation";

async function ensureActiveProject(projectId: string, tx?: any) {
  const project = await ProjectRepository.findActiveById(projectId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TaskService = {
  async findTaskById(id: string) {
    return TaskRepository.findById(id);
  },

  async quickCaptureTask(title: string, projectId?: string) {
    const trimmedTitle = z.string().trim().min(1, "Task title is required.").max(160).parse(title);
    const project = projectId
      ? await ProjectRepository.findActiveById(projectId)
      : await ProjectService.getOrCreateInbox();
    if (!project) throw new Error("The selected project is unavailable.");
    const lastOrder = await TaskRepository.getMaxOrder(project.id, null);
    const task = await TaskRepository.create({
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

  async createTask(input: z.input<typeof taskInputSchema>) {
    const value = taskInputSchema.parse(input);
    await ensureActiveProject(value.projectId);
    if (value.parentTaskId) {
      const parent = await TaskRepository.findActiveById(value.parentTaskId, value.projectId);
      if (!parent) throw new Error("A subtask must belong to an active task in the same project.");
    }
    const lastOrder = await TaskRepository.getMaxOrder(value.projectId, value.parentTaskId);
    const task = await TaskRepository.create({
      ...value,
      order: lastOrder + 1,
      archivedAt: null,
    });
    return { taskId: task.id, projectId: value.projectId };
  },

  async updateTask(taskId: string, input: z.input<typeof taskInputSchema>) {
    const value = taskInputSchema.parse(input);
    const task = await TaskRepository.findActiveById(taskId, value.projectId);
    if (!task) throw new Error("The task is unavailable.");
    await TaskRepository.update(taskId, {
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      focusDate: value.focusDate,
    });
    return { taskId, projectId: value.projectId };
  },

  async toggleTaskCompletion(taskId: string, projectId: string, completed: boolean) {
    await TaskRepository.update(taskId, {
      status: completed ? "completed" : "todo",
    });
    return { taskId, projectId };
  },

  async archiveTask(taskId: string, projectId: string) {
    const allTasks = await TaskRepository.findAllByProject(projectId);
    const ids = descendantIds(taskId, allTasks as TaskRecord[]);
    if (!ids.length) return { projectId };
    await TaskRepository.archiveMany(ids);
    return { projectId };
  },

  async restoreTask(taskId: string, projectId: string) {
    await ensureActiveProject(projectId);
    const allTasks = await TaskRepository.findAllByProject(projectId);
    const byId = new Map(allTasks.map((task: any) => [task.id, task]));
    const ids = new Set(descendantIds(taskId, allTasks as TaskRecord[]));
    let current = byId.get(taskId) as any;
    while (current?.parentTaskId) {
      ids.add(current.parentTaskId);
      current = byId.get(current.parentTaskId) as any;
    }
    await TaskRepository.restoreMany([...ids]);
    return { projectId };
  },

  async duplicateTask(taskId: string, projectId: string) {
    const task = await TaskRepository.findActiveById(taskId, projectId);
    if (!task) throw new Error("Task is unavailable.");
    return this.createTask({
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

  async updateTaskProperty(taskId: string, projectId: string, property: "status" | "priority" | "dueDate" | "focusDate", value: string) {
    await ensureActiveProject(projectId);
    if (property === "status") {
      await TaskRepository.update(taskId, { status: z.enum(taskStatuses).parse(value) });
    } else if (property === "priority") {
      await TaskRepository.update(taskId, { priority: z.enum(priorities).parse(value) });
    } else if (property === "dueDate" || property === "focusDate") {
      await TaskRepository.update(taskId, { [property]: optionalDate.parse(value) });
    }
    return { taskId, projectId };
  },

  async updatePropertyColor(property: "status" | "priority", value: string, color: string) {
    colorInputSchema.parse(color);
    const allowed = property === "status" ? taskStatuses : priorities;
    if (!allowed.includes(value as never)) throw new Error("Unknown property value.");
    await PropertyColorRepository.updatePropertyColor(property, value, color);
  },

  async createTag(input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    if (value.projectId) await ensureActiveProject(value.projectId);
    const tag = await TagRepository.create(value);
    return tag;
  },

  async updateTag(tagId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    await TagRepository.update(tagId, value);
    return tagId;
  },

  async deleteTag(tagId: string) {
    const tag = await TagRepository.findById(tagId);
    if (!tag) return null;
    await TagRepository.delete(tagId);
    return tag.projectId ?? undefined;
  },

  async setTaskTags(taskId: string, projectId: string, tagIds: string[]) {
    const ids = z.array(z.string().uuid()).max(20).parse(tagIds);
    await ensureActiveProject(projectId);
    const available = await TagRepository.findTagsByIds(ids);
    if (available.some((tag: any) => tag.projectId && tag.projectId !== projectId) || available.length !== ids.length) {
      throw new Error("A tag is unavailable for this project.");
    }
    await TagRepository.setTaskTags(taskId, ids);
    return { taskId, projectId };
  },

  async getTaskTableSettings(projectId: string) {
    const [availableTags, colors] = await Promise.all([
      TagRepository.findAllForProjectSettings(projectId),
      PropertyColorRepository.findPropertyColors(),
    ]);
    return { availableTags, colors };
  },

  async getDocumentInbox(query: TaskQuery = defaultTaskQuery) {
    const today = todayIso();
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectRepository.findAllActive(),
    ]);
    const documents = sortTasks(
      (await ProjectService.withAttachmentCounts(taskRows)).filter((task: any) => task.attachmentCount > 0 && matchesTask(task, query, today)),
      query
    );
    const projectNames = new Map(projectRows.map((project: any) => [project.id, project.name]));
    return documents.map((task: any) => ({
      ...task,
      projectName: projectNames.get(task.projectId) ?? "Archived project",
    }));
  },

  async getDashboardData(query: TaskQuery = defaultTaskQuery) {
    const today = todayIso();
    const [taskRows, activeProjects, recentProjects] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectService.getProjectSummaries(),
      ProjectRepository.findAllActive(),
    ]);
    const sortedRecentProjects = [...recentProjects].sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

    const visibleTasks = sortTasks(
      (await ProjectService.withAttachmentCounts(taskRows)).filter((task: any) => matchesTask(task, query, today)),
      query
    );
    const focusTasks = visibleTasks.filter((task: any) => task.status !== "completed" && (task.dueDate === today || task.focusDate === today)).slice(0, 6);
    const highPriorityTasks = visibleTasks.filter((task: any) => task.status !== "completed" && task.priority === "high").slice(0, 6);
    const waitingTasks = visibleTasks.filter((task: any) => task.status === "waiting").slice(0, 6);
    const recentTasks = [...visibleTasks].sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

    return {
      focusTasks: focusTasks.map((task: any) => ({
        ...task,
        source: task.dueDate === today && task.focusDate === today ? "Due today · Focused" : task.dueDate === today ? "Due today" : "Focused",
      })),
      highPriorityTasks,
      waitingTasks,
      activeProjects: activeProjects.filter((project: any) => project.status === "active").slice(0, 6),
      recent: [
        ...sortedRecentProjects.map((project: any) => ({ id: project.id, label: project.name, type: "Project" as const, updatedAt: project.updatedAt, href: `/projects/${project.id}` })),
        ...recentTasks.map((task: any) => ({ id: task.id, label: task.title, type: "Task" as const, updatedAt: task.updatedAt, href: `/projects/${task.projectId}` })),
      ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6),
    };
  },

  async searchTasks(term: string) {
    const query = z.string().trim().min(1).max(100).parse(term).toLowerCase();
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectRepository.findAllActive(),
    ]);
    const projectMap = new Map<string, any>(projectRows.map((p: any) => [p.id, p]));
    const activeTasks = taskRows.filter((task: any) => projectMap.has(task.projectId));
    const taskRowsWithAttachments = await ProjectService.withAttachmentCounts(activeTasks);

    return taskRowsWithAttachments
      .filter((task: any) => {
        const projectName = projectMap.get(task.projectId)?.name ?? "";
        return [
          task.title,
          task.description ?? "",
          projectName,
          ...task.tags.map((tag: any) => tag.name),
          ...task.attachments.map((file: any) => file.fileName),
        ].some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 20)
      .map((task: any) => {
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

  async updateTaskView(viewId: string, input: z.input<typeof taskViewInputSchema>) {
    const value = taskViewInputSchema.parse(input);
    const existing = await TaskViewRepository.findViewFirst(viewId);
    if (!existing) throw new Error("Saved view is unavailable.");
    if (existing.projectId !== value.projectId) throw new Error("Saved view scope cannot be changed.");
    if (value.projectId) {
      await ensureActiveProject(value.projectId);
    }
    await TaskViewRepository.updateView(viewId, { name: value.name, query: value.query });
    return { viewId, projectId: value.projectId };
  },

  async deleteTaskView(viewId: string) {
    const existing = await TaskViewRepository.findViewFirst(viewId);
    if (!existing) return null;
    await TaskViewRepository.deleteView(viewId);
    return existing.projectId;
  },
};
