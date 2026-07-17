import { type AnyPgColumn, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Priority, ProjectStatus, TaskStatus } from "@/types/domain";

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
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("projects_active_updated_idx").on(table.archivedAt, table.updatedAt)]);

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
