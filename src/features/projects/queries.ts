import { ProjectService } from "@/services/project.service";
import { TaskService } from "@/services/task.service";

export type ProjectSummary = import("@/services/project.service").ProjectSummary;

export const withAttachmentCounts = ProjectService.withAttachmentCounts.bind(ProjectService);
export const getProjectSummaries = ProjectService.getProjectSummaries.bind(ProjectService);
export const getProjectDetail = ProjectService.getProjectDetail.bind(ProjectService);
export const getArchivedProjects = ProjectService.getArchivedProjects.bind(ProjectService);
export const getDocumentInbox = TaskService.getDocumentInbox.bind(TaskService);
export const getTaskTableSettings = TaskService.getTaskTableSettings.bind(TaskService);
