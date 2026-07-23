import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProjectService } from "@/services/project.service";
import { headers } from "next/headers";

export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user?.id) {
    return session.user.id;
  }

  // In development mode, fallback to demo user if unauthenticated
  // if (process.env.NODE_ENV === "development") {
  //   const demoUser = await db.query.users.findFirst();
  //   if (demoUser?.id) {
  //     return demoUser.id;
  //   }
  //   const [newUser] = await db
  //     .insert(users)
  //     .values({
  //       email: "admin@personalos.local",
  //       name: "Admin User",
  //     })
  //     .returning();
  //   await ProjectService.getOrCreateInbox(newUser.id);
  //   return newUser.id;
  // }

  // In production mode, redirect unauthenticated visitors to sign in page
  redirect("/auth/signin");
}
