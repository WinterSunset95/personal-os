import { db, type DbClient } from "@/db";
import { taskPropertyColors } from "@/db/schema";

export const PropertyColorRepository = {
  async findPropertyColors(tx: DbClient = db) {
    return tx.select().from(taskPropertyColors);
  },

  async updatePropertyColor(property: "status" | "priority", value: string, color: string, tx: DbClient = db) {
    await tx.insert(taskPropertyColors).values({ property, value, color }).onConflictDoUpdate({
      target: [taskPropertyColors.property, taskPropertyColors.value],
      set: { color, updatedAt: new Date() }
    });
  }
};
