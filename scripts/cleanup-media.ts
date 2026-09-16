/*
  CLEANUP — remove out-of-market listings, their media rows, and their blobs.

  Run MANUALLY. This is deliberately not wired into the sync: the sync's job
  is to keep the feed current, not to mass-delete.

    npx tsx --env-file=.env.local scripts/cleanup-media.ts            # dry run
    npx tsx --env-file=.env.local scripts/cleanup-media.ts --confirm  # execute

  Without --confirm it only prints what it WOULD delete and changes nothing.

  Order of operations matters: blobs are deleted FIRST, while the rows that
  point at them still exist. Dropping the rows first would strand the blobs
  with no record of their URLs — unfindable and billable forever.
*/
import { config } from "dotenv";
import { inArray, notInArray, isNull, or } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { properties, propertyMedia } from "../lib/db/schema";

config({ path: ".env.local", quiet: true });

// Keep in step with ALLOWED_COUNTIES in scripts/sync.ts.
const ALLOWED_COUNTIES = [
  "Nassau County",
  "Suffolk County",
  "Queens",
  "Queens County",
];

const CONFIRMED = process.argv.includes("--confirm");
const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)}GB` : `${(n / 1024 ** 2).toFixed(1)}MB`;

async function main() {
  const { db } = await import("../lib/db");

  // Out of market = county not in the allow-list, INCLUDING NULL. A null
  // county can't be shown to belong to John's market, and notInArray alone
  // evaluates to NULL for those rows and would quietly leave them behind.
  const outOfMarket = or(
    notInArray(properties.countyOrParish, ALLOWED_COUNTIES),
    isNull(properties.countyOrParish),
  );

  const doomed = await db
    .select({
      listingKey: properties.listingKey,
      listingId: properties.listingId,
      county: properties.countyOrParish,
      city: properties.city,
    })
    .from(properties)
    .where(outOfMarket);

  if (doomed.length === 0) {
    console.log("Nothing to clean up — every listing is in-market.");
    return;
  }

  const keys = doomed.map((r) => r.listingKey);

  // Their blobs, found via the rows that still point at them.
  const media = await db
    .select({ mediaKey: propertyMedia.mediaKey, localUrl: propertyMedia.localUrl })
    .from(propertyMedia)
    .where(inArray(propertyMedia.listingKey, keys));

  const blobUrls = media
    .map((m) => m.localUrl)
    .filter((u): u is string => Boolean(u));

  // What's going, grouped by county.
  const byCounty = new Map<string, number>();
  for (const r of doomed) {
    const c = r.county ?? "(no county)";
    byCounty.set(c, (byCounty.get(c) ?? 0) + 1);
  }

  console.log(`${CONFIRMED ? "DELETING" : "DRY RUN — would delete"}:\n`);
  console.log("  listings by county");
  for (const [county, n] of [...byCounty].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(4)}  ${county}`);
  }
  // Real sizes, not an estimate: page the store and total only our blobs.
  const sizeByUrl = new Map<string, number>();
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const b of page.blobs) sizeByUrl.set(b.url, b.size);
    cursor = page.cursor;
  } while (cursor);
  const doomedBytes = blobUrls.reduce((sum, u) => sum + (sizeByUrl.get(u) ?? 0), 0);

  console.log(`\n  ${doomed.length} listings`);
  console.log(`  ${media.length} property_media rows`);
  console.log(`  ${blobUrls.length} blobs in Vercel Blob storage`);
  console.log(`  ${formatBytes(doomedBytes)} of blob storage (measured)\n`);

  if (!CONFIRMED) {
    console.log("Nothing was changed. Re-run with --confirm to execute.");
    return;
  }

  // 1. Blobs first, while the rows still name them.
  let blobsDeleted = 0;
  let blobsFailed = 0;
  const BATCH = 100; // del() accepts many URLs at once
  for (let i = 0; i < blobUrls.length; i += BATCH) {
    const slice = blobUrls.slice(i, i + BATCH);
    try {
      await del(slice);
      blobsDeleted += slice.length;
      console.log(`  blobs ${blobsDeleted}/${blobUrls.length} deleted`);
    } catch (err) {
      blobsFailed += slice.length;
      console.warn(`  ⚠ blob batch failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /*
    2. Then the rows. Deleting the property cascades to property_media via the
       FK, but we delete media explicitly first so the count is reported
       honestly rather than inferred.
  */
  let mediaRowsDeleted = 0;
  let listingsDeleted = 0;
  for (let i = 0; i < keys.length; i += BATCH) {
    const slice = keys.slice(i, i + BATCH);
    await db.delete(propertyMedia).where(inArray(propertyMedia.listingKey, slice));
    mediaRowsDeleted += slice.length;
    await db.delete(properties).where(inArray(properties.listingKey, slice));
    listingsDeleted += slice.length;
  }

  console.log(
    `\nDone. ${listingsDeleted} listings and ${media.length} media rows removed; ` +
      `${blobsDeleted} blobs deleted${blobsFailed ? `, ${blobsFailed} failed` : ""}.`,
  );
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
