import { db } from "@/db";
import { tags, taskTags } from "@/db/schema";
import { and, eq, isNull, or, inArray } from "drizzle-orm";

type DB = typeof db | any;

export const TagRepository = {
  async findById(id: string, tx: DB = db) {
    return tx.query.tags.findFirst({
      where: eq(tags.id, id),
    });
  },

  async findAllForProjectSettings(projectId: string, tx: DB = db) {
    return tx
      .select()
      .from(tags)
      .where(or(isNull(tags.projectId), eq(tags.projectId, projectId)))
      .orderBy(tags.name);
  },

  async findTagsForTasks(taskIds: string[], tx: DB = db) {
    if (!taskIds.length) return [];
    return tx
      .select({
        taskId: taskTags.taskId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
        projectId: tags.projectId,
      })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(inArray(taskTags.taskId, taskIds));
  },

  async create(data: Omit<typeof tags.$inferInsert, "id" | "createdAt" | "updatedAt">, tx: DB = db) {
    const [tag] = await tx.insert(tags).values(data).returning();
    return tag;
  },

  async update(id: string, data: Partial<Omit<typeof tags.$inferInsert, "id">>, tx: DB = db) {
    await tx.update(tags).set({ ...data, updatedAt: new Date() }).where(eq(tags.id, id));
  },

  async delete(id: string, tx: DB = db) {
    await tx.delete(tags).where(eq(tags.id, id));
  },

  async setTaskTags(taskId: string, tagIds: string[], tx: DB = db) {
    await tx.delete(taskTags).where(eq(taskTags.taskId, taskId));
    if (tagIds.length) {
      await tx.insert(taskTags).values(tagIds.map((tagId) => ({ taskId, tagId })));
    }
  },

  async findTagsByIds(ids: string[], tx: DB = db) {
    if (!ids.length) return [];
    return tx.select().from(tags).where(inArray(tags.id, ids));
  }
};
