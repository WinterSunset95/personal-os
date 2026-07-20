import { TagRepository } from "@/repositories/tag.repository";
import { ProjectRepository } from "@/repositories/project.repository";
import { TagRepository as TagRepo } from "@/repositories/tag.repository";
import { z } from "zod";
import { tagInputSchema } from "@/domain/tag/validation";

async function ensureActiveProject(projectId: string, tx?: any) {
  const project = await ProjectRepository.findActiveById(projectId, tx);
  if (!project) throw new Error("The project is unavailable.");
}

export const TagService = {
  async createTag(input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    if (value.projectId) await ensureActiveProject(value.projectId);
    const tag = await TagRepository.create(value);
    return tag;
  },

  async updateTag(tagId: string, input: z.input<typeof tagInputSchema>) {
    const value = tagInputSchema.parse(input);
    await TagRepository.update(tagId, value);
    return tagId;
  },

  async deleteTag(tagId: string) {
    const tag = await TagRepository.findById(tagId);
    if (!tag) return null;
    await TagRepository.delete(tagId);
    return tag.projectId ?? undefined;
  },

  async setTaskTags(taskId: string, projectId: string, tagIds: string[]) {
    const ids = z.array(z.string().uuid()).max(20).parse(tagIds);
    await ensureActiveProject(projectId);
    const available = await TagRepository.findTagsByIds(ids);
    if (
      available.some(
        (tag: any) => tag.projectId && tag.projectId !== projectId,
      ) ||
      available.length !== ids.length
    ) {
      throw new Error("A tag is unavailable for this project.");
    }
    await TagRepository.setTaskTags(taskId, ids);
    return { taskId, projectId };
  },
};
