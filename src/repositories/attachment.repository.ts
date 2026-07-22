import { db } from "@/db";
import { taskAttachments } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type DB = typeof db | any;

export const AttachmentRepository = {
  async findById(id: string, userId: string, tx: DB = db) {
    return tx.query.taskAttachments.findFirst({
      where: and(eq(taskAttachments.id, id), eq(taskAttachments.userId, userId)),
    });
  },

  async findAttachmentsForTasks(taskIds: string[], userId: string, tx: DB = db) {
    if (!taskIds.length) return [];
    return tx
      .select()
      .from(taskAttachments)
      .where(
        and(
          inArray(taskAttachments.taskId, taskIds),
          eq(taskAttachments.userId, userId),
        ),
      );
  },

  async findAll(userId: string, tx: DB = db) {
    return tx
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.userId, userId));
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

  async delete(id: string, userId: string, tx: DB = db) {
    await tx
      .delete(taskAttachments)
      .where(and(eq(taskAttachments.id, id), eq(taskAttachments.userId, userId)));
  },
};
