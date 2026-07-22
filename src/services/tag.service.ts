import { TagRepository } from "@/repositories/tag.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { DbClient } from "@/db";
import { tags } from "@/db/schema";
import { z } from "zod";
import { tagInputSchema } from "@/domain/tag/validation";

type TagDbRow = typeof tags.$inferSelect;

async function ensureActiveProject(projectId: string, userId: string, tx?: DbClient) {
  const project = await ProjectRepository.findActiveById(projectId, userId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TagService = {
  async createTag(userId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    if (value.projectId) await ensureActiveProject(value.projectId, userId);
    const tag = await TagRepository.create({ ...value, userId });
    return tag;
  },

  async updateTag(userId: string, tagId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    await TagRepository.update(tagId, userId, value);
    return tagId;
  },

  async deleteTag(userId: string, tagId: string) {
    const tag = await TagRepository.findById(tagId, userId);
    if (!tag) return null;
    await TagRepository.delete(tagId, userId);
    return tag.projectId ?? undefined;
  },

  async setTaskTags(userId: string, taskId: string, projectId: string, tagIds: string[]) {
    const ids = z.array(z.string().uuid()).max(20).parse(tagIds);
    await ensureActiveProject(projectId, userId);
    const available = await TagRepository.findTagsByIds(ids, userId);
    if (
      available.some(
        (tag: TagDbRow) => tag.projectId && tag.projectId !== projectId,
      ) ||
      available.length !== ids.length
    ) {
      throw new Error("A tag is unavailable for this project.");
    }
    await TagRepository.setTaskTags(taskId, ids);
    return { taskId, projectId };
  },
};
