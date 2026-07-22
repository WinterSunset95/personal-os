"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  restoreProject as defaultRestoreProject,
  restoreTask as defaultRestoreTask,
} from "@/actions/project.actions";

export function RestoreProjectButton({
  projectId,
  onRestore = defaultRestoreProject,
}: {
  projectId: string;
  onRestore?: (id: string) => Promise<any>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => onRestore(projectId))}
    >
      <RotateCcw className="size-4" />
      Restore project
    </Button>
  );
}

export function RestoreTaskButton({
  taskId,
  projectId,
  onRestore = defaultRestoreTask,
}: {
  taskId: string;
  projectId: string;
  onRestore?: (taskId: string, projectId: string) => Promise<any>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(async () => onRestore(taskId, projectId))}
    >
      Restore
    </Button>
  );
}
