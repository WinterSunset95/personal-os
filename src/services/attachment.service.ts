import { AttachmentRepository } from "@/repositories/attachment.repository";
import { TaskRepository } from "@/repositories/task.repository";
import { BlobStorageRepository } from "@/repositories/blob-storage.repository";

export const AttachmentService = {
  async findAttachmentById(id: string) {
    return AttachmentRepository.findById(id);
  },

  async removeAttachment(attachmentId: string, projectId: string) {
    const attachment = await AttachmentRepository.findById(attachmentId);
    if (!attachment) return { projectId };
    const task = await TaskRepository.findActiveById(attachment.taskId, projectId);
    if (!task) throw new Error("The attachment is unavailable.");
    await BlobStorageRepository.deleteBlob(attachment.blobUrl);
    await AttachmentRepository.delete(attachmentId);
    return { projectId };
  },

  async createAttachment(data: { taskId: string; pathname: string; blobUrl: string; fileName: string; contentType: string; size: number }) {
    return AttachmentRepository.create(data);
  },
};
