import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
// import * as schema from "./auth-schema";
import * as schema from "./db/schema"
import { error } from "console";

if (!process.env.DATABASE_URL || !process.env.GITHUB_CLIENT_ID) {
  throw error("DATABASE_URL or GITHUB_CLIENT_ID not available in .env")
}

const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), {
  schema,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true, autoSignIn: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
  }
});
