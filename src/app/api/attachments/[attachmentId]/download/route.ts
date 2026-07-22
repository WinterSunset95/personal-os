import { BlobStorageRepository } from "@/repositories/blob-storage.repository";
import { AttachmentService } from "@/services/attachment.service";
import { requireUserId } from "@/lib/auth-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const userId = await requireUserId();
  const { attachmentId } = await params;
  const attachment = await AttachmentService.findAttachmentById(attachmentId, userId);
  if (!attachment) return new Response("Not found", { status: 404 });
  return Response.redirect(
    BlobStorageRepository.getDownloadUrl(attachment.blobUrl),
  );
}
