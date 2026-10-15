/*
  SCHEDULED SYNC — GET /api/cron/sync, driven by the cron in vercel.json.

  Incremental only. The first full import stays a local script (npm run sync):
  it walks the whole feed and downloads thousands of rate-limited photos over
  hours, which no serverless function can do.

  Protected by a bearer check against CRON_SECRET. Vercel Cron sends that
  header automatically for crons defined in vercel.json.
*/
import { NextResponse } from "next/server";
import { runSync } from "@/lib/mls/sync";

/*
  Ceiling for the function. Vercel's Fluid compute allows up to 800s on Pro
  and 300s on Hobby; 300 is the safe figure that works on either.
*/
export const maxDuration = 300;

// Never cache a job that mutates the database.
export const dynamic = "force-dynamic";

/*
  Stop work at 4 minutes, leaving ~60s of the 300s ceiling to save state and
  respond. The engine only checks this between pages, so the margin has to
  cover finishing the page in flight — including its photo downloads.
*/
const WORK_BUDGET_MS = 4 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // A missing secret must fail closed — an unprotected endpoint that mutates
  // the database and burns MLS Grid rate limit is worse than a broken cron.
  if (!secret) {
    console.error("CRON_SECRET is not set — refusing to run the sync.");
    return NextResponse.json(
      { ok: false, error: "Sync is not configured." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const lines: string[] = [];
  try {
    const result = await runSync({
      incrementalOnly: true,
      budgetMs: WORK_BUDGET_MS,
      log: (m) => {
        lines.push(m);
        console.log(m);
      },
    });

    return NextResponse.json({
      ok: true,
      status: result.status,
      message: result.message,
      pages: result.pages,
      received: result.received,
      upserted: result.upserted,
      deleted: result.deleted,
      outOfMarket: result.outOfMarket,
      photos: {
        stored: result.mediaStored,
        unchanged: result.mediaSkipped,
        replaced: result.mediaReplaced,
        failed: result.mediaFailed,
      },
      watermark: result.highWater?.toISOString() ?? null,
      log: lines,
    });
  } catch (err) {
    /*
      runSync already saved sync_state as "failed" before rethrowing, so the
      next run resumes from the watermark rather than starting over.
    */
    console.error("Scheduled sync failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Sync failed",
        log: lines,
      },
      { status: 500 },
    );
  }
}
