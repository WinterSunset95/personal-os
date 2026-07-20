import { db } from "@/db";
import { tasks, taskViews, taskPropertyColors } from "@/db/schema";
import { and, eq, isNull, isNotNull, inArray, max, or, desc } from "drizzle-orm";

type DB = typeof db | any;

export const TaskRepository = {
  async findById(id: string, tx: DB = db) {
    return tx.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });
  },

  async findActiveById(id: string, projectId: string, tx: DB = db) {
    return tx.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.projectId, projectId), isNull(tasks.archivedAt)),
    });
  },

  async findAllActive(tx: DB = db) {
    return tx.select().from(tasks).where(isNull(tasks.archivedAt));
  },

  async findAllArchived(tx: DB = db) {
    return tx.select().from(tasks).where(isNotNull(tasks.archivedAt)).orderBy(desc(tasks.archivedAt));
  },

  async findAllActiveByProject(projectId: string, tx: DB = db) {
    return tx.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  },

  async findAllByProject(projectId: string, tx: DB = db) {
    return tx.select().from(tasks).where(eq(tasks.projectId, projectId));
  },

  async getMaxOrder(projectId: string, parentTaskId: string | null, tx: DB = db) {
    const [last] = await tx
      .select({ last: max(tasks.order) })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          parentTaskId ? eq(tasks.parentTaskId, parentTaskId) : isNull(tasks.parentTaskId)
        )
      );
    return last?.last ?? 0;
  },

  async create(data: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">, tx: DB = db) {
    const [task] = await tx.insert(tasks).values(data).returning();
    return task;
  },

  async update(id: string, data: Partial<Omit<typeof tasks.$inferInsert, "id">>, tx: DB = db) {
    await tx.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
  },

  async archiveMany(ids: string[], archivedAt: Date = new Date(), tx: DB = db) {
    if (!ids.length) return;
    await tx.update(tasks).set({ archivedAt, updatedAt: archivedAt }).where(inArray(tasks.id, ids));
  },

  async archiveAllByProject(projectId: string, archivedAt: Date = new Date(), tx: DB = db) {
    await tx.update(tasks).set({ archivedAt, updatedAt: archivedAt }).where(eq(tasks.projectId, projectId));
  },

  async restoreMany(ids: string[], tx: DB = db) {
    if (!ids.length) return;
    await tx.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(inArray(tasks.id, ids));
  },

  async restoreAllByProject(projectId: string, tx: DB = db) {
    await tx.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(eq(tasks.projectId, projectId));
  },

  // Task Views
  async findViews(projectId: string | null, tx: DB = db) {
    const scope = projectId
      ? or(isNull(taskViews.projectId), eq(taskViews.projectId, projectId))
      : isNull(taskViews.projectId);
    return tx.select().from(taskViews).where(scope).orderBy(desc(taskViews.updatedAt));
  },

  async findViewFirst(viewId: string, tx: DB = db) {
    return tx.query.taskViews.findFirst({ where: eq(taskViews.id, viewId) });
  },

  async createView(data: Omit<typeof taskViews.$inferInsert, "id" | "createdAt" | "updatedAt">, tx: DB = db) {
    const [view] = await tx.insert(taskViews).values(data).returning();
    return view;
  },

  async updateView(id: string, data: Partial<Omit<typeof taskViews.$inferInsert, "id">>, tx: DB = db) {
    await tx.update(taskViews).set({ ...data, updatedAt: new Date() }).where(eq(taskViews.id, id));
  },

  async deleteView(id: string, tx: DB = db) {
    await tx.delete(taskViews).where(eq(taskViews.id, id));
  },

  // Property Colors
  async findPropertyColors(tx: DB = db) {
    return tx.select().from(taskPropertyColors);
  },

  async updatePropertyColor(property: "status" | "priority", value: string, color: string, tx: DB = db) {
    await tx.insert(taskPropertyColors).values({ property, value, color }).onConflictDoUpdate({
      target: [taskPropertyColors.property, taskPropertyColors.value],
      set: { color, updatedAt: new Date() }
    });
  }
};
