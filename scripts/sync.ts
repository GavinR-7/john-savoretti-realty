/*
  MLS GRID SYNC — local CLI entry point.
    npm run sync

  (The npm script passes --conditions=react-server: lib/db imports
  `server-only`, which throws unless that export condition is set. Next
  sets it for server components; plain tsx does not.)

  The engine lives in lib/mls/sync.ts so the Vercel cron route can share it.
  This wrapper exists for two reasons only: it loads .env.local (the route
  gets env from the platform), and it allows a FULL import — the first run,
  which pulls thousands of photos over hours and must never happen inside a
  serverless function.
*/
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  // Imported after dotenv so the db module sees DATABASE_URL.
  const { runSync } = await import("../lib/mls/sync");
  await runSync();
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
