import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { taskAttachments, tasks } from "@/db/schema";

const allowedContentTypes = [
  "application/pdf", "text/plain", "text/csv", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/webp",
];
const maxSize = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as { taskId?: string; fileSize?: number };
        if (!payload.taskId) throw new Error("A task is required for uploads.");
        const task = await db.query.tasks.findFirst({ where: and(eq(tasks.id, payload.taskId), isNull(tasks.archivedAt)) });
        if (!task || !pathname.startsWith(`tasks/${task.id}/`)) throw new Error("The task is unavailable.");
        return { allowedContentTypes, maximumSizeInBytes: maxSize, addRandomSuffix: true, tokenPayload: JSON.stringify(payload) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as { taskId?: string; fileName?: string; fileSize?: number };
        if (!payload.taskId) throw new Error("A task is required for uploads.");
        await db.insert(taskAttachments).values({
          taskId: payload.taskId, pathname: blob.pathname, blobUrl: blob.url,
          fileName: payload.fileName ?? blob.pathname.split("/").at(-1) ?? "Attachment",
          contentType: blob.contentType, size: payload.fileSize ?? 0,
        }).onConflictDoNothing({ target: taskAttachments.blobUrl });
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
