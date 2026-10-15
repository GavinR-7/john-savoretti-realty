import "server-only";
// Importing this from a client component is a BUILD ERROR, not a runtime
// surprise: it would ship the Postgres connection string to the browser.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check .env.local");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });