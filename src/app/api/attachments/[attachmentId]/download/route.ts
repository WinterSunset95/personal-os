import { BlobStorageRepository } from "@/repositories/blob-storage.repository";
import { AttachmentService } from "@/services/attachment.service";

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  const attachment = await AttachmentService.findAttachmentById(attachmentId);
  if (!attachment) return new Response("Not found", { status: 404 });
  return Response.redirect(BlobStorageRepository.getDownloadUrl(attachment.blobUrl));
}
