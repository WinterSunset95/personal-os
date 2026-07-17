"use client";

import { useState } from "react";
import { BookmarkPlus, Check, MoreHorizontal, Pencil, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createTaskView, deleteTaskView, updateTaskView } from "./task-view-actions";
import { sameTaskQuery, taskQueryToSearchParams, type TaskQuery } from "./task-query";
import type { TaskViewOption } from "./task-views";
import { usePathname, useRouter } from "next/navigation";

type DialogMode = "save" | "rename" | null;

export function SavedViews({ query, views, selectedViewId, projectId }: { query: TaskQuery; views: TaskViewOption[]; selectedViewId?: string; projectId?: string }) {
  const router = useRouter(); const pathname = usePathname();
  const selected = views.find((view) => view.id === selectedViewId);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const modified = !!selected && !sameTaskQuery(query, selected.query);
  const open = (mode: DialogMode) => { setError(""); setName(mode === "rename" ? selected?.name ?? "" : `${selected?.name ?? ""}${selected ? " copy" : ""}`); setDialogMode(mode); };
  const navigate = (view?: TaskViewOption) => { const params = view ? taskQueryToSearchParams(view.query, view.id) : taskQueryToSearchParams(query); router.replace(`${pathname}${params.size ? `?${params}` : ""}`); };
  const submit = async () => {
    if (!dialogMode || !name.trim()) return;
    setBusy(true); setError("");
    try {
      if (dialogMode === "rename" && selected && !selected.builtIn) {
        await updateTaskView(selected.id, { name, projectId: selected.projectId, query: selected.query });
        router.refresh();
      } else {
        const id = await createTaskView({ name, projectId: projectId ?? null, query });
        const params = taskQueryToSearchParams(query, id);
        router.replace(`${pathname}?${params}`); router.refresh();
      }
      setDialogMode(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save view."); }
    finally { setBusy(false); }
  };
  const update = async () => {
    if (!selected || selected.builtIn) return;
    setBusy(true); setError("");
    try { await updateTaskView(selected.id, { name: selected.name, projectId: selected.projectId, query }); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update view."); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!selected || selected.builtIn || !window.confirm(`Delete “${selected.name}”?`)) return;
    setBusy(true); setError("");
    try { await deleteTaskView(selected.id); navigate(); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete view."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 rounded-xl border bg-background p-3"><div className="flex flex-wrap items-center gap-2"><div className="flex max-w-full gap-1 overflow-x-auto"><Button type="button" size="sm" variant={!selected ? "secondary" : "ghost"} onClick={() => navigate()}>Default</Button>{views.map((view) => <Button key={view.id} type="button" size="sm" variant={selected?.id === view.id ? "secondary" : "ghost"} onClick={() => navigate(view)}>{view.name}</Button>)}</div><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="outline" aria-label="Manage saved views"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => open("save")}><BookmarkPlus />Save as new view</DropdownMenuItem>{selected && !selected.builtIn && <><DropdownMenuItem disabled={!modified || busy} onSelect={update}><Save />Update view</DropdownMenuItem><DropdownMenuItem onSelect={() => open("rename")}><Pencil />Rename view</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={remove}><Trash2 />Delete view</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>{modified && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3" />Modified</span>}</div>{error && <p className="text-xs text-destructive">{error}</p>}<Dialog open={dialogMode !== null} onOpenChange={(value) => !value && setDialogMode(null)}><DialogContent><DialogHeader><DialogTitle>{dialogMode === "rename" ? "Rename view" : "Save view"}</DialogTitle><DialogDescription>{dialogMode === "rename" ? "Choose a clear name for this saved view." : "Save the current sort and filters for quick access."}</DialogDescription></DialogHeader><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="View name" maxLength={60} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submit(); } }} /><DialogFooter showCloseButton><Button type="button" disabled={busy || !name.trim()} onClick={() => void submit()}>{busy ? "Saving…" : "Save view"}</Button></DialogFooter></DialogContent></Dialog></div>;
}
