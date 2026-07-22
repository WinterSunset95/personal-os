import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { Priority, ProjectStatus, TaskStatus } from "@/types/domain";
import type { TaskQuery } from "@/domain/task/query";
import type { AdapterAccountType } from "next-auth/adapters";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};


export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})
 
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
      primaryKey({
        columns: [account.provider, account.providerAccountId],
      })
  ]
)
 
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
      primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
  ]
)
 
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
      primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
  ]
)

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().$type<ProjectStatus>().default("active"),
    priority: text("priority").notNull().$type<Priority>().default("none"),
    dueDate: text("due_date"),
    isSystemInbox: boolean("is_system_inbox").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("projects_user_active_updated_idx").on(table.userId, table.archivedAt, table.updatedAt),
    uniqueIndex("projects_user_one_system_inbox_idx")
      .on(table.userId, table.isSystemInbox)
      .where(sql`${table.isSystemInbox} = true`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentTaskId: uuid("parent_task_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "cascade" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().$type<TaskStatus>().default("todo"),
    priority: text("priority").notNull().$type<Priority>().default("none"),
    dueDate: text("due_date"),
    focusDate: text("focus_date"),
    order: integer("order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("tasks_user_project_active_idx").on(table.userId, table.projectId, table.archivedAt),
    index("tasks_parent_order_idx").on(table.parentTaskId, table.order),
    index("tasks_user_dashboard_idx").on(table.userId, table.archivedAt, table.status, table.dueDate),
  ],
);

export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    pathname: text("pathname").notNull(),
    blobUrl: text("blob_url").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("task_attachments_task_idx").on(table.taskId),
    index("task_attachments_created_idx").on(table.createdAt),
    uniqueIndex("task_attachments_blob_url_idx").on(table.blobUrl),
  ],
);

export const taskViews = pgTable(
  "task_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    query: jsonb("query").$type<TaskQuery>().notNull(),
    ...timestamps,
  },
  (table) => [
    index("task_views_scope_updated_idx").on(table.userId, table.projectId, table.updatedAt),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#64748b"),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ...timestamps,
  },
  (table) => [index("tags_scope_name_idx").on(table.userId, table.projectId, table.name)],
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("task_tags_unique_idx").on(table.taskId, table.tagId),
    index("task_tags_tag_idx").on(table.tagId),
  ],
);

export const taskPropertyColors = pgTable(
  "task_property_colors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    property: text("property").notNull().$type<"status" | "priority">(),
    value: text("value").notNull(),
    color: text("color").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("task_property_colors_unique_idx").on(
      table.userId,
      table.property,
      table.value,
    ),
  ],
);
