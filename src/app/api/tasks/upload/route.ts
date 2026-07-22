import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { TaskService } from "@/services/task.service";
import { AttachmentService } from "@/services/attachment.service";
import { requireUserId } from "@/lib/auth-utils";

const allowedContentTypes = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const maxSize = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const userId = await requireUserId();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as {
          taskId?: string;
          fileSize?: number;
        };
        if (!payload.taskId) throw new Error("A task is required for uploads.");
        const task = await TaskService.findTaskById(payload.taskId, userId);
        if (
          !task ||
          task.archivedAt ||
          !pathname.startsWith(`tasks/${task.id}/`)
        ) {
          throw new Error("The task is unavailable.");
        }
        return {
          allowedContentTypes,
          maximumSizeInBytes: maxSize,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...payload, userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as {
          taskId?: string;
          fileName?: string;
          fileSize?: number;
          userId?: string;
        };
        if (!payload.taskId || !payload.userId) throw new Error("Task and User ID required.");
        await AttachmentService.createAttachment({
          userId: payload.userId,
          taskId: payload.taskId,
          pathname: blob.pathname,
          blobUrl: blob.url,
          fileName:
            payload.fileName ?? blob.pathname.split("/").at(-1) ?? "Attachment",
          contentType: blob.contentType,
          size: payload.fileSize ?? 0,
        });
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
