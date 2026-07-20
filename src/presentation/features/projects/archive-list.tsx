"use client";
import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreProject, restoreTask } from "@/actions/project.actions";
export function RestoreProjectButton({ projectId }: { projectId: string }) { const [pending, startTransition] = useTransition(); return <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => restoreProject(projectId))}><RotateCcw className="size-4" />Restore project</Button>; }
export function RestoreTaskButton({ taskId, projectId }: { taskId: string; projectId: string }) { const [pending, startTransition] = useTransition(); return <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(async () => restoreTask(taskId, projectId))}>Restore</Button>; }
