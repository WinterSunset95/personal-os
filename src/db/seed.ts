import { db } from "./index";
import { projects, tasks, users } from "./schema";
import { todayIso } from "@/lib/date";
import crypto from "crypto";

async function seed() {
  const existing = await db.query.users.findFirst();
  if (existing) return console.log("Seed skipped: database already contains a user.");

  const today = todayIso();

  // 1. Create our mock tenant
  const [demoUser] = await db.insert(users).values({
    id: crypto.randomUUID(),
    email: "admin@personalos.local",
    name: "Admin User",
  }).returning();

  // 2. Pass demoUser.id into EVERYTHING
  const [project] = await db.insert(projects).values({
    userId: demoUser.id,
    name: "Personal OS MVP", 
    description: "A calm, useful home for the work that matters.",
    status: "active", priority: "high", dueDate: today,
  }).returning();

  const [plan] = await db.insert(tasks).values({
    userId: demoUser.id,
    projectId: project.id, 
    title: "Shape the dashboard", 
    status: "in_progress", priority: "high", 
    dueDate: today, focusDate: today, order: 1,
  }).returning();

  await db.insert(tasks).values([
    { userId: demoUser.id, projectId: project.id, parentTaskId: plan.id, title: "Review today’s focus", priority: "high", dueDate: today, order: 1 },
    { userId: demoUser.id, projectId: project.id, parentTaskId: plan.id, title: "Keep the layout calm", priority: "medium", order: 2 },
    { userId: demoUser.id, projectId: project.id, title: "Add first project tasks", priority: "medium", order: 2 },
  ]);

  await db.insert(projects).values({ 
    userId: demoUser.id, 
    name: "Weekend reset", 
    status: "planned", priority: "low" 
  });
  
  console.log(`Seeded isolated workspace for ${demoUser.email}.`);
}

seed().catch((error) => { console.error(error); process.exitCode = 1; });
