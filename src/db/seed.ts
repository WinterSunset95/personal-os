import { db } from "./index";
import { projects, tasks } from "./schema";
import { todayIso } from "@/lib/date";

async function seed() {
  const existing = await db.query.projects.findFirst();
  if (existing) return console.log("Seed skipped: workspace already contains projects.");

  const today = todayIso();
  const [project] = await db.insert(projects).values({
    name: "Personal OS MVP", description: "A calm, useful home for the work that matters.",
    status: "active", priority: "high", dueDate: today,
  }).returning();
  const [plan] = await db.insert(tasks).values({
    projectId: project.id, title: "Shape the dashboard", status: "in_progress", priority: "high", dueDate: today, focusDate: today, order: 1,
  }).returning();
  await db.insert(tasks).values([
    { projectId: project.id, parentTaskId: plan.id, title: "Review today’s focus", priority: "high", dueDate: today, order: 1 },
    { projectId: project.id, parentTaskId: plan.id, title: "Keep the layout calm", priority: "medium", order: 2 },
    { projectId: project.id, title: "Add first project tasks", priority: "medium", order: 2 },
  ]);
  await db.insert(projects).values({ name: "Weekend reset", status: "planned", priority: "low" });
  console.log("Seeded a sample Personal OS workspace.");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; });
