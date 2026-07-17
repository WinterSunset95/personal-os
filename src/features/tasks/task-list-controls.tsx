"use client";

import { ArrowDownUp, RotateCcw, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { priorityLabels, taskStatusLabels } from "@/types/domain";
import { dueFilters, taskSorts, type TaskQuery } from "./task-query";

const sortLabels = { priority: "Priority", due_date: "Due date", status: "Status", updated_at: "Recently updated" } as const;
const dueLabels = { today: "Today", this_week: "This week", overdue: "Overdue", no_due_date: "No due date" } as const;

export function TaskListControls({ query }: { query: TaskQuery }) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const update = (key: string, value?: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); router.replace(`${pathname}${next.size ? `?${next}` : ""}`); };
  const toggleList = (key: "status" | "priority", value: string) => { const values = new Set((params.get(key) ?? "").split(",").filter(Boolean)); if (values.has(value)) values.delete(value); else values.add(value); update(key, [...values].join(",")); };
  const chips = [
    ...query.statuses.map((status) => ({ key: "status", value: status, label: `Status: ${taskStatusLabels[status]}` })),
    ...query.priorities.map((priority) => ({ key: "priority", value: priority, label: `Priority: ${priorityLabels[priority]}` })),
    ...(query.due ? [{ key: "due", value: "", label: `Due: ${dueLabels[query.due]}` }] : []),
    ...(query.hasAttachments ? [{ key: "attachments", value: "", label: "Has attachments" }] : []),
  ];
  return <div className="space-y-3 rounded-xl border bg-background p-3"><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="size-4 text-muted-foreground" /><select aria-label="Sort tasks" value={query.sort} onChange={(event) => update("sort", event.target.value)} className="h-8 rounded-md border bg-background px-2 text-sm">{taskSorts.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}</select><Button type="button" size="sm" variant="outline" onClick={() => update("direction", query.direction === "asc" ? "desc" : "asc")}><ArrowDownUp className="size-3.5" />{query.direction === "asc" ? "Ascending" : "Descending"}</Button><details className="relative"><summary className="cursor-pointer rounded-md border px-3 py-1.5 text-sm">Filter</summary><div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border bg-popover p-3 shadow-lg"><p className="mb-2 text-xs font-medium text-muted-foreground">Status</p><div className="grid gap-1">{Object.entries(taskStatusLabels).map(([status, label]) => <label key={status} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={query.statuses.includes(status as never)} onChange={() => toggleList("status", status)} />{label}</label>)}</div><p className="mb-2 mt-3 text-xs font-medium text-muted-foreground">Priority</p><div className="grid gap-1">{Object.entries(priorityLabels).filter(([priority]) => priority !== "none").map(([priority, label]) => <label key={priority} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={query.priorities.includes(priority as never)} onChange={() => toggleList("priority", priority)} />{label}</label>)}</div><p className="mb-2 mt-3 text-xs font-medium text-muted-foreground">Due date</p><select value={query.due ?? ""} onChange={(event) => update("due", event.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-sm"><option value="">Any date</option>{dueFilters.map((due) => <option key={due} value={due}>{dueLabels[due]}</option>)}</select><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={query.hasAttachments} onChange={(event) => update("attachments", event.target.checked ? "true" : "")} />Has attachments</label></div></details>{chips.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => router.replace(pathname)}><RotateCcw className="size-3.5" />Clear all</Button>}</div>{chips.length > 0 && <div className="flex flex-wrap gap-2">{chips.map((chip) => <button key={`${chip.key}-${chip.value}`} type="button" onClick={() => chip.key === "status" || chip.key === "priority" ? toggleList(chip.key, chip.value) : update(chip.key)} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground">{chip.label} ×</button>)}</div>}</div>;
}
