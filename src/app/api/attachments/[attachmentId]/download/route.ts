import { getDownloadUrl } from "@vercel/blob";
import { AttachmentRepository } from "@/repositories/attachment.repository";

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  const attachment = await AttachmentRepository.findById(attachmentId);
  if (!attachment) return new Response("Not found", { status: 404 });
  return Response.redirect(getDownloadUrl(attachment.blobUrl));
}
