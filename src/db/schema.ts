import { sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { Priority, ProjectStatus, TaskStatus } from "@/types/domain";
import type { TaskQuery } from "@/features/tasks/task-query";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().$type<ProjectStatus>().default("active"),
  priority: text("priority").notNull().$type<Priority>().default("none"),
  dueDate: text("due_date"),
  isSystemInbox: boolean("is_system_inbox").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("projects_active_updated_idx").on(table.archivedAt, table.updatedAt),
  uniqueIndex("projects_one_system_inbox_idx").on(table.isSystemInbox).where(sql`${table.isSystemInbox} = true`),
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().$type<TaskStatus>().default("todo"),
  priority: text("priority").notNull().$type<Priority>().default("none"),
  dueDate: text("due_date"),
  focusDate: text("focus_date"),
  order: integer("order").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("tasks_project_active_idx").on(table.projectId, table.archivedAt),
  index("tasks_parent_order_idx").on(table.parentTaskId, table.order),
  index("tasks_dashboard_idx").on(table.archivedAt, table.status, table.dueDate),
]);

export const taskAttachments = pgTable("task_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  pathname: text("pathname").notNull(),
  blobUrl: text("blob_url").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("task_attachments_task_idx").on(table.taskId),
  index("task_attachments_created_idx").on(table.createdAt),
  uniqueIndex("task_attachments_blob_url_idx").on(table.blobUrl),
]);

export const taskViews = pgTable("task_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  query: jsonb("query").$type<TaskQuery>().notNull(),
  ...timestamps,
}, (table) => [
  index("task_views_scope_updated_idx").on(table.projectId, table.updatedAt),
]);
