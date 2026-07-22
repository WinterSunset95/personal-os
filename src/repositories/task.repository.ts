import { db, type DbClient } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq, isNull, isNotNull, inArray, max, desc } from "drizzle-orm";

export const TaskRepository = {
  async findById(id: string, userId: string, tx: DbClient = db) {
    return tx.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
    });
  },

  async findActiveById(id: string, projectId: string, userId: string, tx: DbClient = db) {
    return tx.query.tasks.findFirst({
      where: and(
        eq(tasks.id, id),
        eq(tasks.projectId, projectId),
        eq(tasks.userId, userId),
        isNull(tasks.archivedAt),
      ),
    });
  },

  async findAllActive(userId: string, tx: DbClient = db) {
    return tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.archivedAt)));
  },

  async findAllArchived(userId: string, tx: DbClient = db) {
    return tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNotNull(tasks.archivedAt)))
      .orderBy(desc(tasks.archivedAt));
  },

  async findAllActiveByProject(projectId: string, userId: string, tx: DbClient = db) {
    return tx
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          eq(tasks.userId, userId),
          isNull(tasks.archivedAt),
        ),
      );
  },

  async findAllByProject(projectId: string, userId: string, tx: DbClient = db) {
    return tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)));
  },

  async getMaxOrder(
    projectId: string,
    parentTaskId: string | null,
    userId: string,
    tx: DbClient = db,
  ) {
    const [last] = await tx
      .select({ last: max(tasks.order) })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          eq(tasks.userId, userId),
          parentTaskId
            ? eq(tasks.parentTaskId, parentTaskId)
            : isNull(tasks.parentTaskId),
        ),
      );
    return last?.last ?? 0;
  },

  async create(
    data: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">,
    tx: DbClient = db,
  ) {
    const [task] = await tx.insert(tasks).values(data).returning();
    return task;
  },

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<typeof tasks.$inferInsert, "id">>,
    tx: DbClient = db,
  ) {
    await tx
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  },

  async archiveMany(
    ids: string[],
    userId: string,
    archivedAt: Date = new Date(),
    tx: DbClient = db,
  ) {
    if (!ids.length) return;
    await tx
      .update(tasks)
      .set({ archivedAt, updatedAt: archivedAt })
      .where(and(inArray(tasks.id, ids), eq(tasks.userId, userId)));
  },

  async archiveAllByProject(
    projectId: string,
    userId: string,
    archivedAt: Date = new Date(),
    tx: DbClient = db,
  ) {
    await tx
      .update(tasks)
      .set({ archivedAt, updatedAt: archivedAt })
      .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)));
  },

  async restoreMany(ids: string[], userId: string, tx: DbClient = db) {
    if (!ids.length) return;
    await tx
      .update(tasks)
      .set({ archivedAt: null, updatedAt: new Date() })
      .where(and(inArray(tasks.id, ids), eq(tasks.userId, userId)));
  },

  async restoreAllByProject(projectId: string, userId: string, tx: DbClient = db) {
    await tx
      .update(tasks)
      .set({ archivedAt: null, updatedAt: new Date() })
      .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)));
  },
};
