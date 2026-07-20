import { db } from "@/db";
import { TaskRepository } from "@/repositories/task.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { TagRepository } from "@/repositories/tag.repository";
import { ProjectService } from "./project.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { taskInputSchema } from "@/domain/task/validation";
import { descendantIds, type TaskRecord } from "@/domain/task/tree";
import { priorities, taskStatuses, type Priority, type TaskStatus } from "@/domain/task/types";
import { defaultTaskQuery, matchesTask, sortTasks, type TaskQuery } from "@/domain/task/query";
import { todayIso } from "@/lib/date";

const colorInput = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const tagInput = z.object({ name: z.string().trim().min(1).max(40), color: colorInput, projectId: z.string().uuid().nullable() });
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((value) => value || null);

function refresh(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/archive");
  revalidatePath("/documents");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

async function ensureActiveProject(projectId: string, tx = db) {
  const project = await ProjectRepository.findActiveById(projectId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TaskService = {
  async quickCaptureTask(title: string, projectId?: string) {
    const trimmedTitle = z.string().trim().min(1, "Task title is required.").max(160).parse(title);
    const project = projectId
      ? await ProjectRepository.findActiveById(projectId)
      : await ProjectService.getOrCreateInbox();
    if (!project) throw new Error("The selected project is unavailable.");
    const lastOrder = await TaskRepository.getMaxOrder(project.id, null);
    await TaskRepository.create({
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
    refresh(project.id);
  },

  async createTask(input: z.input<typeof taskInputSchema>) {
    const value = taskInputSchema.parse(input);
    await ensureActiveProject(value.projectId);
    if (value.parentTaskId) {
      const parent = await TaskRepository.findActiveById(value.parentTaskId, value.projectId);
      if (!parent) throw new Error("A subtask must belong to an active task in the same project.");
    }
    const lastOrder = await TaskRepository.getMaxOrder(value.projectId, value.parentTaskId);
    await TaskRepository.create({
      ...value,
      order: lastOrder + 1,
      archivedAt: null,
    });
    refresh(value.projectId);
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
    refresh(value.projectId);
  },

  async toggleTaskCompletion(taskId: string, projectId: string, completed: boolean) {
    await TaskRepository.update(taskId, {
      status: completed ? "completed" : "todo",
    });
    refresh(projectId);
  },

  async archiveTask(taskId: string, projectId: string) {
    const allTasks = await TaskRepository.findAllByProject(projectId);
    const ids = descendantIds(taskId, allTasks as TaskRecord[]);
    if (!ids.length) return;
    await TaskRepository.archiveMany(ids);
    refresh(projectId);
  },

  async restoreTask(taskId: string, projectId: string) {
    await ensureActiveProject(projectId);
    const allTasks = await TaskRepository.findAllByProject(projectId);
    const byId = new Map(allTasks.map((task) => [task.id, task]));
    const ids = new Set(descendantIds(taskId, allTasks as TaskRecord[]));
    let current = byId.get(taskId);
    while (current?.parentTaskId) {
      ids.add(current.parentTaskId);
      current = byId.get(current.parentTaskId);
    }
    await TaskRepository.restoreMany([...ids]);
    refresh(projectId);
  },

  async duplicateTask(taskId: string, projectId: string) {
    const task = await TaskRepository.findActiveById(taskId, projectId);
    if (!task) throw new Error("Task is unavailable.");
    await this.createTask({
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
    refresh(projectId);
  },

  async updatePropertyColor(property: "status" | "priority", value: string, color: string) {
    colorInput.parse(color);
    const allowed = property === "status" ? taskStatuses : priorities;
    if (!allowed.includes(value as never)) throw new Error("Unknown property value.");
    await TaskRepository.updatePropertyColor(property, value, color);
    refresh();
  },

  async createTag(input: z.input<typeof tagInput>) {
    const value = tagInput.parse(input);
    if (value.projectId) await ensureActiveProject(value.projectId);
    const tag = await TagRepository.create(value);
    refresh(value.projectId ?? undefined);
    return tag;
  },

  async updateTag(tagId: string, input: z.input<typeof tagInput>) {
    const value = tagInput.parse(input);
    await TagRepository.update(tagId, value);
    refresh(value.projectId ?? undefined);
  },

  async deleteTag(tagId: string) {
    const tag = await TagRepository.findById(tagId);
    if (!tag) return;
    await TagRepository.delete(tagId);
    refresh(tag.projectId ?? undefined);
  },

  async setTaskTags(taskId: string, projectId: string, tagIds: string[]) {
    const ids = z.array(z.string().uuid()).max(20).parse(tagIds);
    await ensureActiveProject(projectId);
    const available = await TagRepository.findTagsByIds(ids);
    if (available.some((tag) => tag.projectId && tag.projectId !== projectId) || available.length !== ids.length) {
      throw new Error("A tag is unavailable for this project.");
    }
    await TagRepository.setTaskTags(taskId, ids);
    refresh(projectId);
  },

  async getTaskTableSettings(projectId: string) {
    const [availableTags, colors] = await Promise.all([
      TagRepository.findAllForProjectSettings(projectId),
      TaskRepository.findPropertyColors(),
    ]);
    return { availableTags, colors };
  },

  async getDocumentInbox(query: TaskQuery = defaultTaskQuery) {
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectRepository.findAllActive(),
    ]);
    const documents = sortTasks(
      (await ProjectService.withAttachmentCounts(taskRows)).filter((task) => task.attachmentCount > 0 && matchesTask(task, query)),
      query
    );
    const projectNames = new Map(projectRows.map((project) => [project.id, project.name]));
    return documents.map((task) => ({
      ...task,
      projectName: projectNames.get(task.projectId) ?? "Archived project"
    }));
  },

  async getDashboardData(query: TaskQuery = defaultTaskQuery) {
    const today = todayIso();
    const [taskRows, activeProjects, recentProjects] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectService.getProjectSummaries(),
      ProjectRepository.findAllActive(),
    ]);
    const sortedRecentProjects = [...recentProjects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

    const visibleTasks = sortTasks(
      (await ProjectService.withAttachmentCounts(taskRows)).filter((task) => matchesTask(task, query)),
      query
    );
    const focusTasks = visibleTasks.filter((task) => task.status !== "completed" && (task.dueDate === today || task.focusDate === today)).slice(0, 6);
    const highPriorityTasks = visibleTasks.filter((task) => task.status !== "completed" && task.priority === "high").slice(0, 6);
    const waitingTasks = visibleTasks.filter((task) => task.status === "waiting").slice(0, 6);
    const recentTasks = [...visibleTasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

    return {
      focusTasks: focusTasks.map((task) => ({
        ...task,
        source: task.dueDate === today && task.focusDate === today ? "Due today · Focused" : task.dueDate === today ? "Due today" : "Focused"
      })),
      highPriorityTasks,
      waitingTasks,
      activeProjects: activeProjects.filter((project) => project.status === "active").slice(0, 6),
      recent: [
        ...sortedRecentProjects.map((project) => ({ id: project.id, label: project.name, type: "Project" as const, updatedAt: project.updatedAt, href: `/projects/${project.id}` })),
        ...recentTasks.map((task) => ({ id: task.id, label: task.title, type: "Task" as const, updatedAt: task.updatedAt, href: `/projects/${task.projectId}` })),
      ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6),
    };
  },

  async searchTasks(term: string) {
    const query = z.string().trim().min(1).max(100).parse(term).toLowerCase();
    const [taskRows, projectRows] = await Promise.all([
      TaskRepository.findAllActive(),
      ProjectRepository.findAllActive(),
    ]);
    const projectMap = new Map(projectRows.map((p) => [p.id, p]));
    const activeTasks = taskRows.filter((task) => projectMap.has(task.projectId));
    const taskRowsWithAttachments = await ProjectService.withAttachmentCounts(activeTasks);

    return taskRowsWithAttachments
      .filter((task) => {
        const projectName = projectMap.get(task.projectId)?.name ?? "";
        return [
          task.title,
          task.description ?? "",
          projectName,
          ...task.tags.map((tag) => tag.name),
          ...task.attachments.map((file) => file.fileName)
        ].some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 20)
      .map((task) => {
        const projectName = projectMap.get(task.projectId)?.name ?? "";
        return {
          id: task.id,
          title: task.title,
          projectId: task.projectId,
          projectName,
          status: task.status,
          priority: task.priority,
          tags: task.tags
        };
      });
  }
};
