import { AttachmentRepository } from "@/repositories/attachment.repository";
import { TaskRepository } from "@/repositories/task.repository";
import { BlobStorageRepository } from "@/repositories/blob-storage.repository";

export const AttachmentService = {
  async findAttachmentById(id: string, userId: string) {
    return AttachmentRepository.findById(id, userId);
  },

  async removeAttachment(attachmentId: string, projectId: string, userId: string) {
    const attachment = await AttachmentRepository.findById(attachmentId, userId);
    if (!attachment) return { projectId };
    const task = await TaskRepository.findActiveById(
      attachment.taskId,
      projectId,
      userId,
    );
    if (!task) throw new Error("The attachment is unavailable.");
    await BlobStorageRepository.deleteBlob(attachment.blobUrl);
    await AttachmentRepository.delete(attachmentId, userId);
    return { projectId };
  },

  async createAttachment(data: {
    userId: string;
    taskId: string;
    pathname: string;
    blobUrl: string;
    fileName: string;
    contentType: string;
    size: number;
  }) {
    return AttachmentRepository.create(data);
  },
};
