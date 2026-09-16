/*
  ONE-OFF: recompress already-stored photos in place.

    npx tsx --env-file=.env.local scripts/recompress-media.ts            # dry run
    npx tsx --env-file=.env.local scripts/recompress-media.ts --confirm  # execute

  Why this exists: photos imported before compression landed are stored as
  full-size originals. They cannot be re-fetched from MLS Grid — their CDN
  serves a given image exactly once and answers 429 forever after — but we
  already hold the bytes, so we can shrink them without touching the feed
  at all. NO MLS GRID TRAFFIC HAPPENS HERE.

  Because nothing here talks to MLS Grid, their 2 req/sec cap does not apply;
  the only host involved is our own blob store. A small amount of concurrency
  is therefore fine and makes a 2,000-image pass finish in minutes.

  Per image: download blob → resize/re-encode → upload as .webp → point the
  row at the new URL → delete the old blob. The old blob is removed only
  after the database already points at the replacement, so an interruption
  can never leave a row referencing something that no longer exists.
*/
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { propertyMedia } from "../lib/db/schema";

config({ path: ".env.local", quiet: true });

// Must match scripts/sync.ts so old and new photos are stored identically.
const MAX_IMAGE_WIDTH = 1600;
const WEBP_QUALITY = 82;

// Parallel workers. Safe: our own storage, no MLS Grid involvement.
const CONCURRENCY = 4;

const CONFIRMED = process.argv.includes("--confirm");
const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)}GB` : `${(n / 1024 ** 2).toFixed(1)}MB`;

async function main() {
  const { db } = await import("../lib/db");

  // Anything not already stored as .webp is a candidate. Re-running is a
  // no-op, so this is safe to repeat.
  const candidates = await db
    .select({
      mediaKey: propertyMedia.mediaKey,
      listingKey: propertyMedia.listingKey,
      localUrl: propertyMedia.localUrl,
    })
    .from(propertyMedia)
    .where(sql`${propertyMedia.localUrl} IS NOT NULL AND ${propertyMedia.localUrl} NOT LIKE '%.webp'`);

  if (candidates.length === 0) {
    console.log("Nothing to recompress — every stored photo is already .webp.");
    return;
  }

  console.log(
    `${CONFIRMED ? "RECOMPRESSING" : "DRY RUN — would recompress"} ${candidates.length} photos ` +
      `(${MAX_IMAGE_WIDTH}px max, webp q${WEBP_QUALITY}).\n`,
  );

  if (!CONFIRMED) {
    // Sample a handful so the projected saving is measured, not guessed.
    const sample = candidates.slice(0, 5);
    let before = 0;
    let after = 0;
    for (const row of sample) {
      const buf = Buffer.from(await (await fetch(row.localUrl!)).arrayBuffer());
      const out = await sharp(buf)
        .rotate()
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      before += buf.byteLength;
      after += out.byteLength;
      console.log(
        `  ${(buf.byteLength / 1024).toFixed(0).padStart(5)}KB → ${(out.byteLength / 1024).toFixed(0).padStart(5)}KB` +
          `  (−${Math.round((1 - out.byteLength / buf.byteLength) * 100)}%)`,
      );
    }
    const ratio = after / before;
    console.log(
      `\n  sample: ${formatBytes(before)} → ${formatBytes(after)} (−${Math.round((1 - ratio) * 100)}%)`,
    );
    console.log("\nNothing was changed. Re-run with --confirm to execute.");
    return;
  }

  let done = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  // Simple worker pool: each worker pulls the next index until the list runs out.
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= candidates.length) return;
      const row = candidates[i];
      const oldUrl = row.localUrl!;
      try {
        const original = Buffer.from(await (await fetch(oldUrl)).arrayBuffer());
        const compressed = await sharp(original)
          .rotate()
          .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();

        const blob = await put(
          `properties/${row.listingKey}/${row.mediaKey}.webp`,
          compressed,
          { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/webp" },
        );

        // Point the row at the replacement BEFORE removing the original.
        await db
          .update(propertyMedia)
          .set({ localUrl: blob.url })
          .where(eq(propertyMedia.mediaKey, row.mediaKey));

        if (blob.url !== oldUrl) {
          try {
            await del(oldUrl);
          } catch {
            /* the row is already correct; a stray old blob is not worth failing over */
          }
        }

        bytesBefore += original.byteLength;
        bytesAfter += compressed.byteLength;
        done += 1;
        if (done % 100 === 0) {
          console.log(
            `  ${done}/${candidates.length} — ${formatBytes(bytesBefore)} → ${formatBytes(bytesAfter)} so far`,
          );
        }
      } catch (err) {
        failed += 1;
        console.warn(`  ⚠ ${row.mediaKey}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const saved = bytesBefore - bytesAfter;
  console.log(
    `\nDone. ${done} recompressed${failed ? `, ${failed} failed` : ""}.\n` +
      `${formatBytes(bytesBefore)} → ${formatBytes(bytesAfter)} ` +
      `(−${bytesBefore ? Math.round((saved / bytesBefore) * 100) : 0}%, reclaimed ${formatBytes(saved)}).`,
  );
}

main().catch((err) => {
  console.error("Recompression failed:", err);
  process.exit(1);
});
