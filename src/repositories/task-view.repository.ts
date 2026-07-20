import { db, type DbClient } from "@/db";
import { taskViews } from "@/db/schema";
import { eq, isNull, or, desc } from "drizzle-orm";

export const TaskViewRepository = {
  async findViews(projectId: string | null, tx: DbClient = db) {
    const scope = projectId
      ? or(isNull(taskViews.projectId), eq(taskViews.projectId, projectId))
      : isNull(taskViews.projectId);
    return tx.select().from(taskViews).where(scope).orderBy(desc(taskViews.updatedAt));
  },

  async findViewFirst(viewId: string, tx: DbClient = db) {
    return tx.query.taskViews.findFirst({ where: eq(taskViews.id, viewId) });
  },

  async createView(data: Omit<typeof taskViews.$inferInsert, "id" | "createdAt" | "updatedAt">, tx: DbClient = db) {
    const [view] = await tx.insert(taskViews).values(data).returning();
    return view;
  },

  async updateView(id: string, data: Partial<Omit<typeof taskViews.$inferInsert, "id">>, tx: DbClient = db) {
    await tx.update(taskViews).set({ ...data, updatedAt: new Date() }).where(eq(taskViews.id, id));
  },

  async deleteView(id: string, tx: DbClient = db) {
    await tx.delete(taskViews).where(eq(taskViews.id, id));
  },
};
