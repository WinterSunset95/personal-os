import { db } from "@/db";
import { projects } from "@/db/schema";
import { and, eq, isNull, isNotNull, desc } from "drizzle-orm";

type DB = typeof db | any;

export const ProjectRepository = {
  async findById(id: string, tx: DB = db) {
    return tx.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  },

  async findActiveById(id: string, tx: DB = db) {
    return tx.query.projects.findFirst({
      where: and(eq(projects.id, id), isNull(projects.archivedAt)),
    });
  },

  async findSystemInbox(tx: DB = db) {
    return tx.query.projects.findFirst({
      where: eq(projects.isSystemInbox, true),
    });
  },

  async findAllActive(tx: DB = db) {
    return tx
      .select()
      .from(projects)
      .where(isNull(projects.archivedAt))
      .orderBy(desc(projects.updatedAt));
  },

  async findAllArchived(tx: DB = db) {
    return tx
      .select()
      .from(projects)
      .where(isNotNull(projects.archivedAt))
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
    data: Partial<Omit<typeof projects.$inferInsert, "id">>,
    tx: DB = db,
  ) {
    await tx
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id));
  },

  async archive(id: string, archivedAt: Date = new Date(), tx: DB = db) {
    await tx
      .update(projects)
      .set({ archivedAt, updatedAt: archivedAt })
      .where(eq(projects.id, id));
  },

  async restore(id: string, tx: DB = db) {
    const now = new Date();
    await tx
      .update(projects)
      .set({ archivedAt: null, updatedAt: now })
      .where(eq(projects.id, id));
  },
};
