import { db } from "@/db";
import { taskAttachments } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

type DB = typeof db | any;

export const AttachmentRepository = {
  async findById(id: string, tx: DB = db) {
    return tx.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, id),
    });
  },

  async findAttachmentsForTasks(taskIds: string[], tx: DB = db) {
    if (!taskIds.length) return [];
    return tx
      .select()
      .from(taskAttachments)
      .where(inArray(taskAttachments.taskId, taskIds));
  },

  async findAll(tx: DB = db) {
    return tx.select().from(taskAttachments);
  },

  async create(
    data: Omit<typeof taskAttachments.$inferInsert, "id" | "createdAt">,
    tx: DB = db,
  ) {
    const [attachment] = await tx
      .insert(taskAttachments)
      .values(data)
      .onConflictDoNothing({ target: taskAttachments.blobUrl })
      .returning();
    return attachment;
  },

  async delete(id: string, tx: DB = db) {
    await tx.delete(taskAttachments).where(eq(taskAttachments.id, id));
  },
};
