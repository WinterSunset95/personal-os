import { db, type DbClient } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq, isNull, isNotNull, inArray, max, desc } from "drizzle-orm";

export const TaskRepository = {
  async findById(id: string, tx: DbClient = db) {
    return tx.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });
  },

  async findActiveById(id: string, projectId: string, tx: DbClient = db) {
    return tx.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.projectId, projectId), isNull(tasks.archivedAt)),
    });
  },

  async findAllActive(tx: DbClient = db) {
    return tx.select().from(tasks).where(isNull(tasks.archivedAt));
  },

  async findAllArchived(tx: DbClient = db) {
    return tx.select().from(tasks).where(isNotNull(tasks.archivedAt)).orderBy(desc(tasks.archivedAt));
  },

  async findAllActiveByProject(projectId: string, tx: DbClient = db) {
    return tx.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  },

  async findAllByProject(projectId: string, tx: DbClient = db) {
    return tx.select().from(tasks).where(eq(tasks.projectId, projectId));
  },

  async getMaxOrder(projectId: string, parentTaskId: string | null, tx: DbClient = db) {
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

  async create(data: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">, tx: DbClient = db) {
    const [task] = await tx.insert(tasks).values(data).returning();
    return task;
  },

  async update(id: string, data: Partial<Omit<typeof tasks.$inferInsert, "id">>, tx: DbClient = db) {
    await tx.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
  },

  async archiveMany(ids: string[], archivedAt: Date = new Date(), tx: DbClient = db) {
    if (!ids.length) return;
    await tx.update(tasks).set({ archivedAt, updatedAt: archivedAt }).where(inArray(tasks.id, ids));
  },

  async archiveAllByProject(projectId: string, archivedAt: Date = new Date(), tx: DbClient = db) {
    await tx.update(tasks).set({ archivedAt, updatedAt: archivedAt }).where(eq(tasks.projectId, projectId));
  },

  async restoreMany(ids: string[], tx: DbClient = db) {
    if (!ids.length) return;
    await tx.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(inArray(tasks.id, ids));
  },

  async restoreAllByProject(projectId: string, tx: DbClient = db) {
    await tx.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(eq(tasks.projectId, projectId));
  },
};
