import { db, type DbClient } from "@/db";
import { taskViews } from "@/db/schema";
import { and, eq, isNull, or, desc } from "drizzle-orm";

export const TaskViewRepository = {
  async findViews(projectId: string | null, userId: string, tx: DbClient = db) {
    const scope = projectId
      ? or(isNull(taskViews.projectId), eq(taskViews.projectId, projectId))
      : isNull(taskViews.projectId);
    return tx
      .select()
      .from(taskViews)
      .where(and(eq(taskViews.userId, userId), scope))
      .orderBy(desc(taskViews.updatedAt));
  },

  async findViewFirst(viewId: string, userId: string, tx: DbClient = db) {
    return tx.query.taskViews.findFirst({
      where: and(eq(taskViews.id, viewId), eq(taskViews.userId, userId)),
    });
  },

  async createView(
    data: Omit<typeof taskViews.$inferInsert, "id" | "createdAt" | "updatedAt">,
    tx: DbClient = db,
  ) {
    const [view] = await tx.insert(taskViews).values(data).returning();
    return view;
  },

  async updateView(
    id: string,
    userId: string,
    data: Partial<Omit<typeof taskViews.$inferInsert, "id">>,
    tx: DbClient = db,
  ) {
    await tx
      .update(taskViews)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(taskViews.id, id), eq(taskViews.userId, userId)));
  },

  async deleteView(id: string, userId: string, tx: DbClient = db) {
    await tx
      .delete(taskViews)
      .where(and(eq(taskViews.id, id), eq(taskViews.userId, userId)));
  },
};
