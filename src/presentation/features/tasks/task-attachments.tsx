"use client";

import { upload } from "@vercel/blob/client";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeTaskAttachment } from "@/features/projects/actions";
import type { TaskAttachmentRecord } from "@/domain/task/tree";

export function TaskAttachments({ taskId, projectId, attachments }: { taskId: string; projectId: string; attachments: TaskAttachmentRecord[] }) {
  const inputRef = useRef<HTMLInputElement>(null); const [uploading, setUploading] = useState(false); const [pending, startTransition] = useTransition();
  const addFile = async (file?: File) => { if (!file) return; setUploading(true); try { await upload(`tasks/${taskId}/${file.name}`, file, { access: "private", handleUploadUrl: "/api/tasks/upload", clientPayload: JSON.stringify({ taskId, fileName: file.name, fileSize: file.size }) }); window.location.reload(); } finally { setUploading(false); } };
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">Attachments</span><input ref={inputRef} type="file" className="hidden" onChange={(event) => addFile(event.target.files?.[0])} /><Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}><Upload className="size-3.5" />{uploading ? "Uploading…" : "Attach file"}</Button></div><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFile(event.dataTransfer.files[0]); }} className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">Drop a document here or choose a file (PDF, Office, spreadsheet, text, or image; max 25 MB).</div>{attachments.length > 0 && <ul className="divide-y rounded-md border">{attachments.map((attachment) => <li key={attachment.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm"><span className="min-w-0 truncate"><Paperclip className="mr-1 inline size-3.5" />{attachment.fileName}</span><span className="flex shrink-0 gap-1"><Button asChild size="icon-sm" variant="ghost"><a href={`/api/attachments/${attachment.id}/download`} aria-label={`Download ${attachment.fileName}`}><Download className="size-3.5" /></a></Button><Button type="button" size="icon-sm" variant="ghost" disabled={pending} aria-label={`Remove ${attachment.fileName}`} onClick={() => startTransition(async () => removeTaskAttachment(attachment.id, projectId))}><Trash2 className="size-3.5" /></Button></span></li>)}</ul>}</div>;
}
