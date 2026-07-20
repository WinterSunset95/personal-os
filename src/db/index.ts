import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database-backed pages require a PostgreSQL connection.");
}

const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
export type DbClient = typeof db;
