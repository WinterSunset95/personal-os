"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchTasks } from "@/features/projects/actions";

type Result = Awaited<ReturnType<typeof searchTasks>>[number];
export function GlobalSearch() {
  const [open, setOpen] = useState(false); const [term, setTerm] = useState(""); const [results, setResults] = useState<Result[]>([]); const [pending, start] = useTransition(); const router = useRouter();
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); } }; addEventListener("keydown", handler); return () => removeEventListener("keydown", handler); }, []);
  useEffect(() => { const timeout = setTimeout(() => { if (!term.trim()) setResults([]); else start(async () => setResults(await searchTasks(term))); }, term.trim() ? 180 : 0); return () => clearTimeout(timeout); }, [term]);
  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Search className="size-4" />Search <kbd className="text-xs">⌘K</kbd></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Search tasks</DialogTitle></DialogHeader><Input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search tasks, projects, tags, or files…" /><div className="max-h-80 overflow-auto">{pending && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}{results.map((result) => <button key={result.id} type="button" onClick={() => { setOpen(false); router.push(`/projects/${result.projectId}?task=${result.id}`); }} className="flex w-full items-center justify-between gap-3 border-b px-2 py-3 text-left hover:bg-muted"><span className="min-w-0"><span className="block truncate font-medium">{result.title}</span><span className="text-xs text-muted-foreground">{result.projectName}</span></span><span className="flex flex-wrap justify-end gap-1">{result.tags.slice(0, 2).map((tag) => <span key={tag.id} className="rounded px-1.5 py-0.5 text-xs" style={{ color: tag.color, backgroundColor: `${tag.color}18` }}>{tag.name}</span>)}</span></button>)}{term && !pending && !results.length && <p className="p-3 text-sm text-muted-foreground">No matching active tasks.</p>}</div></DialogContent></Dialog></>;
}
