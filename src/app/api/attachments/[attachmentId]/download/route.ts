import { getDownloadUrl } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAttachments } from "@/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  const attachment = await db.query.taskAttachments.findFirst({ where: eq(taskAttachments.id, attachmentId) });
  if (!attachment) return new Response("Not found", { status: 404 });
  return Response.redirect(getDownloadUrl(attachment.blobUrl));
}
