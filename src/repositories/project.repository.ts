import { db } from "@/db";
import { projects } from "@/db/schema";
import { and, eq, isNull, isNotNull, desc } from "drizzle-orm";

type DB = typeof db | any;

export const ProjectRepository = {
  async findById(id: string, userId: string, tx: DB = db) {
    return tx.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, userId)),
    });
  },

  async findActiveById(id: string, userId: string, tx: DB = db) {
    return tx.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId),
        isNull(projects.archivedAt),
      ),
    });
  },

  async findSystemInbox(userId: string, tx: DB = db) {
    return tx.query.projects.findFirst({
      where: and(eq(projects.userId, userId), eq(projects.isSystemInbox, true)),
    });
  },

  async findAllActive(userId: string, tx: DB = db) {
    return tx
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), isNull(projects.archivedAt)))
      .orderBy(desc(projects.updatedAt));
  },

  async findAllArchived(userId: string, tx: DB = db) {
    return tx
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), isNotNull(projects.archivedAt)))
      .orderBy(desc(projects.archivedAt));
  },

  async create(
    data: Omit<typeof projects.$inferInsert, "id" | "createdAt" | "updatedAt">,
    tx: DB = db,
  ) {
    const [project] = await tx.insert(projects).values(data).returning();
    return project;
  },

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<typeof projects.$inferInsert, "id">>,
    tx: DB = db,
  ) {
    await tx
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  },

  async archive(id: string, userId: string, archivedAt: Date = new Date(), tx: DB = db) {
    await tx
      .update(projects)
      .set({ archivedAt, updatedAt: archivedAt })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  },

  async restore(id: string, userId: string, tx: DB = db) {
    const now = new Date();
    await tx
      .update(projects)
      .set({ archivedAt: null, updatedAt: now })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  },
};
