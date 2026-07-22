import { db, type DbClient } from "@/db";
import { taskPropertyColors } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const PropertyColorRepository = {
  async findPropertyColors(userId: string, tx: DbClient = db) {
    return tx
      .select()
      .from(taskPropertyColors)
      .where(eq(taskPropertyColors.userId, userId));
  },

  async updatePropertyColor(
    userId: string,
    property: "status" | "priority",
    value: string,
    color: string,
    tx: DbClient = db,
  ) {
    await tx
      .insert(taskPropertyColors)
      .values({ userId, property, value, color })
      .onConflictDoUpdate({
        target: [
          taskPropertyColors.userId,
          taskPropertyColors.property,
          taskPropertyColors.value,
        ],
        set: { color, updatedAt: new Date() },
      });
  },
};
