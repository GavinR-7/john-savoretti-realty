import "server-only";

/*
  Shared MLS Grid sync engine. Both entry points call runSync():
    • scripts/sync.ts            — local CLI, does the initial full import
    • app/api/cron/sync/route.ts — Vercel cron, incremental only

  This used to live entirely in the script, so the cron route would have had
  to duplicate it. The two callers now differ only in the options they pass.
  Env comes from the platform here — the CLI loads dotenv before importing.
*/

/*
  MLS GRID SYNC — paginated, incremental, resumable.
  Run with: npm run sync

  ── CONTROL FLOW ───────────────────────────────────────────────────────────

    read sync_state("Property")
      ├─ timestamp present → incremental: ModificationTimestamp gt <ts>
      └─ absent            → full import
                │
                ▼
    ┌──────────────────────────────────────────────┐
    │ url = first page                             │
    │ while (url) {                                │
    │   throttle()          ≤ 2 req/sec            │
    │   page = await fetch(url)   ← SEQUENTIAL     │
    │   for each record:                           │
    │     track its ModificationTimestamp          │
    │     MlgCanView false → DELETE                │
    │     otherwise        → UPSERT                │
    │   url = page["@odata.nextLink"]              │
    │ }                                            │
    └──────────────────────────────────────────────┘
                │
       ┌────────┴────────┐
    success            failure
       │                 │
       ▼                 ▼
    status "success"   status "failed"
       └────────┬────────┘
                ▼
      write sync_state (BOTH paths); the high-water mark
      only advances after a complete pass

  The whole loop is wrapped so a failure on page 40 keeps pages 1–39: whatever
  we processed before the error is still committed. The high-water mark stays
  put (results are unordered, so a partial pass can't vouch for unread pages),
  and the next run repeats the query, skipping every photo it already holds.

  ── WHY THE FILTER NO LONGER SAYS `MlgCanView eq true` ─────────────────────
  That condition hid deletions. MLS Grid signals a delete by flipping
  MlgCanView to false, so filtering those out server-side meant we never
  learned a listing was gone and it stayed on the site forever. We now request
  them and delete locally.
*/
import { eq, inArray } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { properties, propertyMedia, syncState } from "@/lib/db/schema";

const API_URL = process.env.MLSGRID_API_URL!; // https://api-demo.mlsgrid.com/v2
const TOKEN = process.env.MLSGRID_TOKEN!;
const ORIGINATING_SYSTEM = "onekey2";
const RESOURCE = "Property";

/*
  ── MARKET FILTER ─────────────────────────────────────────────────────────
  John works Nassau, Suffolk, and Queens. OneKey's footprint is far larger
  (it absorbed the Hudson Valley board), so most of the feed is out of market.

  ⚠️ THESE STRINGS ARE NOT UNIFORM. The feed writes "Nassau County" and
  "Suffolk County" WITH the suffix but plain "Queens" WITHOUT it (other NYC
  boroughs use yet another style: "Kings (Brooklyn)"). Filtering on
  "Queens County" would silently drop every Queens listing — the single
  largest group in the feed. Both spellings are listed defensively.

  ⚠️ THIS CANNOT BE PUSHED TO THE API. Replication requests to Property may
  only be filtered on: MlgCanView, ModificationTimestamp, OriginatingSystemName,
  StandardStatus, ListingId, PropertyType, ListOfficeMlsId. CountyOrParish is
  rejected with 400 "Invalid filter field". So we apply it as the first thing
  we do with each record instead — before the upsert and, crucially, before any
  photo download, which is where the real cost is.
*/
const ALLOWED_COUNTIES = [
  "Nassau County",
  "Suffolk County",
  "Queens",
  "Queens County", // defensive: not currently emitted, but harmless if it appears
];

const isInMarket = (county: string | null | undefined): boolean =>
  typeof county === "string" && ALLOWED_COUNTIES.includes(county.trim());

/*
  Page size is bounded from BOTH directions.

  Upper bound (theirs): 5000 normally, but only 1000 when $expand is used —
  and we always use $expand=Media, so anything larger is rejected with
  400 "When using $expand you can only retrieve 1000 records per request."

  Upper bound (ours, and the tighter one): every MediaURL on a page is signed
  at the moment that page is fetched and dies one hour later. We drain a
  page's photos sequentially at 2 req/sec, so a page holding more than about
  an hour's worth of downloads will have its tail expire before we reach it —
  observed as a burst of 400s at the end of a long run. At ~8.6 photos per
  listing and ~0.75s per photo, 200 listings ≈ 1,700 photos ≈ 21 minutes,
  which leaves a wide margin under the hour. Extra page requests are cheap
  next to the photo downloads they protect.
*/
const PAGE_SIZE = 200;

/*
  Rate limit: their Best Practices cap us at 2 requests/second and warn that
  exceeding it can get the token suspended. 500ms between request STARTS is
  exactly 2/sec; 600ms leaves headroom for clock jitter.
*/
const MIN_MS_BETWEEN_REQUESTS = 600;

// Accept-Encoding is REQUIRED by MLS Grid — they reject uncompressed requests.
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Accept-Encoding": "gzip,deflate",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MlsGridPage = {
  value: any[];
  "@odata.nextLink"?: string;
};

/*
  Throttle measured from the last request START, not its end. If a page took
  900ms to come back we've already satisfied the interval and go immediately;
  only a fast response makes us wait out the remainder.
*/
let lastRequestAt = 0;
async function throttle() {
  const waitFor = lastRequestAt + MIN_MS_BETWEEN_REQUESTS - Date.now();
  if (waitFor > 0) await sleep(waitFor);
  lastRequestAt = Date.now();
}

async function fetchPage(url: string): Promise<MlsGridPage> {
  await throttle();
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`API returned ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as MlsGridPage;
}

/*
  The first page's URL. Every page after this one comes from @odata.nextLink,
  which already carries the filter and paging cursor — we must follow it
  verbatim rather than building our own offsets.

  Incremental runs append `ModificationTimestamp gt <ts>`. Their docs are
  explicit that this must be `gt` against a single value — never a range
  query (`ge ... and le ...`), which can silently skip records.
*/
function buildFirstPageUrl(since: Date | null): string {
  let filter = `OriginatingSystemName eq '${ORIGINATING_SYSTEM}'`;
  if (since) {
    filter += ` and ModificationTimestamp gt ${since.toISOString()}`;
  }
  const params = new URLSearchParams({
    $filter: filter,
    $top: String(PAGE_SIZE),
    $expand: "Media",
  });
  return `${API_URL}/${RESOURCE}?${params.toString()}`;
}

/*
  ── MEDIA LIMITS ──────────────────────────────────────────────────────────
  Photo downloads hit the SAME 2 req/sec budget as the property pages, so
  they share the throttle() above rather than getting their own.

  Separately they cap total downloads at 4GB/hour. We track bytes in a
  rolling one-hour window and park the run if the next photo would breach it.
*/
/*
  Photos are stored once at a single size — next/image handles responsive
  resizing from there. 1600px wide covers the largest slot on the site
  (the full-width listing gallery) on a 2x display.
*/
const MAX_IMAGE_WIDTH = 1600;
const WEBP_QUALITY = 82;

const MAX_BYTES_PER_HOUR = 4 * 1024 * 1024 * 1024;
const ONE_HOUR_MS = 60 * 60 * 1000;

const downloadWindow: { at: number; bytes: number }[] = [];
let totalBytesDownloaded = 0;

function bytesInWindow(): number {
  const cutoff = Date.now() - ONE_HOUR_MS;
  while (downloadWindow.length && downloadWindow[0].at < cutoff) downloadWindow.shift();
  return downloadWindow.reduce((sum, d) => sum + d.bytes, 0);
}

/*
  If the last hour is already at the cap, sleep until the oldest download
  ages out of the window rather than blowing the limit.
*/
async function waitForDownloadBudget() {
  while (downloadWindow.length && bytesInWindow() >= MAX_BYTES_PER_HOUR) {
    const waitMs = downloadWindow[0].at + ONE_HOUR_MS - Date.now() + 1000;
    console.log(
      `  ⏸  4GB/hour cap reached — pausing ${Math.ceil(waitMs / 60000)} min for budget to free up`,
    );
    await sleep(Math.max(waitMs, 1000));
  }
}

function recordDownload(bytes: number) {
  downloadWindow.push({ at: Date.now(), bytes });
  totalBytesDownloaded += bytes;
}

const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)}GB` : `${(n / 1024 ** 2).toFixed(1)}MB`;

/*
  ⚠️ SIGNED-URL HYGIENE. MediaURLs are single-use and expire an hour after
  they're generated, and their docs say they must not be stored or cached for
  later use. The signature lives in the FIRST PATH SEGMENT, not a query string:

    https://media.../token=<sig>&expires=<ts>&id=<id>/images/KEY.../photo.jpeg

  We keep only the stable tail for provenance and drop the credential, so no
  usable signed URL is ever persisted.
*/
function stripSignature(url: string): string {
  try {
    const u = new URL(url);
    u.pathname = u.pathname.replace(/^\/token=[^/]*/, "");
    return u.toString();
  } catch {
    return url;
  }
}

/*
  ── ONE PROPERTY'S PHOTOS ─────────────────────────────────────────────────

  DEDUP, on TWO keys. Media is normally immutable — an edited photo arrives as
  a brand new MediaKey — but their docs are explicit that a MediaModificationTimestamp
  which differs from the one we stored means the image itself changed and must
  be re-downloaded. So a photo is skipped only when the MediaKey exists AND its
  stored timestamp still matches. Anything else is re-fetched and replaced, with
  the superseded blob deleted so we stop paying to host it.

  This matters beyond correctness: their CDN serves a given image once and
  answers 429 to every repeat, so re-downloading anything we already hold is
  both wasteful and futile. One query per property answers "which of these do
  we already have, and at what timestamp".
*/
async function syncMediaForProperty(
  db: any,
  listingKey: string,
  media: any[],
  progress: Progress,
  shouldStop: () => boolean = () => false,
) {
  // Only photos the MLS says we may publish.
  const publishable = (media ?? []).filter(
    (m) => Array.isArray(m?.Permission) && m.Permission.includes("Public") && m?.MediaKey && m?.MediaURL,
  );
  if (!publishable.length) return;

  // ONE query for the whole property's dedup check, not one per photo.
  const incomingKeys = publishable.map((m) => String(m.MediaKey));
  const existingRows = await db
    .select({
      mediaKey: propertyMedia.mediaKey,
      stamp: propertyMedia.mediaModificationTimestamp,
      localUrl: propertyMedia.localUrl,
    })
    .from(propertyMedia)
    .where(inArray(propertyMedia.mediaKey, incomingKeys));

  const existing = new Map<string, { stamp: Date | null; localUrl: string | null }>(
    existingRows.map((r: any) => [r.mediaKey, { stamp: r.stamp, localUrl: r.localUrl }]),
  );

  const work: { item: any; supersedes: string | null }[] = [];
  for (const item of publishable) {
    const prior = existing.get(String(item.MediaKey));
    const incomingStamp = item.MediaModificationTimestamp
      ? new Date(item.MediaModificationTimestamp)
      : null;

    if (prior) {
      const sameStamp =
        (prior.stamp?.getTime() ?? null) === (incomingStamp?.getTime() ?? null);
      if (sameStamp) {
        progress.mediaSkipped += 1; // unchanged — no download
        continue;
      }
      // Changed image reusing the same key: re-download and drop the old blob.
      work.push({ item, supersedes: prior.localUrl });
      progress.mediaReplaced += 1;
    } else {
      work.push({ item, supersedes: null });
    }
  }

  for (const { item, supersedes } of work) {
    // Out of time: leave the rest. They have no stored row yet, so the next
    // run (which re-reads this property from the old watermark) fetches them.
    if (shouldStop()) return;
    // One bad photo must not take down the property or the run.
    try {
      await waitForDownloadBudget();
      await throttle(); // shares the 2 req/sec budget with property pages

      /*
        ⚠️ SINGLE-USE URL: downloaded here, in the same run, moments after the
        page that produced it. The URL is never queued, cached, or persisted
        in usable form.
      */
      const res = await fetch(item.MediaURL, {
        // ⚠️ REQUIRED: MLS Grid blocks media requests (429) unless the
        // user-agent header carries the OAuth token.
        headers: { "user-agent": TOKEN },
      });
      if (!res.ok) throw new Error(`media download ${res.status}`);

      const original = Buffer.from(await res.arrayBuffer());
      // Bandwidth accounting tracks what we pulled FROM THEM, pre-compression.
      recordDownload(original.byteLength);

      /*
        Shrink before storing. Originals run ~3.5MB, which is the dominant
        storage cost. resize() with only a width keeps the aspect ratio and
        never crops; withoutEnlargement leaves already-small images alone;
        rotate() bakes in EXIF orientation before the metadata is dropped.
      */
      const compressed = await sharp(original)
        .rotate()
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      progress.bytesOriginal += original.byteLength;
      progress.bytesCompressed += compressed.byteLength;

      const blob = await put(`properties/${listingKey}/${item.MediaKey}.webp`, compressed, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
      });

      await db.insert(propertyMedia).values({
        mediaKey: String(item.MediaKey),
        listingKey,
        order: typeof item.Order === "number" ? item.Order : 0,
        localUrl: blob.url,
        sourceUrl: stripSignature(item.MediaURL),
        mediaModificationTimestamp: item.MediaModificationTimestamp
          ? new Date(item.MediaModificationTimestamp)
          : null,
      }).onConflictDoUpdate({
        target: propertyMedia.mediaKey,
        set: {
          listingKey,
          order: typeof item.Order === "number" ? item.Order : 0,
          localUrl: blob.url,
          sourceUrl: stripSignature(item.MediaURL),
          mediaModificationTimestamp: item.MediaModificationTimestamp
            ? new Date(item.MediaModificationTimestamp)
            : null,
        },
      });

      // Only now that the replacement is safely stored, bin the old blob.
      if (supersedes && supersedes !== blob.url) {
        try {
          await del(supersedes);
        } catch (err) {
          console.warn(`    ⚠ could not delete superseded blob: ${err instanceof Error ? err.message : err}`);
        }
      }

      const pct = Math.round((1 - compressed.byteLength / original.byteLength) * 100);
      console.log(
        `    ✓ ${item.MediaKey}: ${(original.byteLength / 1024).toFixed(0)}KB → ` +
          `${(compressed.byteLength / 1024).toFixed(0)}KB webp (−${pct}%)`,
      );

      progress.mediaStored += 1;
    } catch (err) {
      progress.mediaFailed += 1;
      console.warn(
        `    ⚠ photo ${item.MediaKey} failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

/*
  ── QUEENS LOCALITY ───────────────────────────────────────────────────────

  Queens listings arrive with City = "New York" (153 of 164 in the feed; the
  rest are null or a bare "Queens"). That's technically the municipality, but
  it reads wrong for a Long Island brokerage and produced an /areas/new-york
  page.

  The feed has no KEY_Hamlet or MLSAreaMajor, but PostalCity IS populated on
  every Queens row and holds the actual neighbourhood — Flushing, Jamaica,
  Bayside, Forest Hills, Middle Village. So for Queens we prefer PostalCity
  and fall back to "Queens" when it's absent.

  This is done HERE, at the mapper, rather than at display time: the city
  column is what the search filters, the town dropdown, and the /areas pages
  all query, so rewriting it only on the way out would make a listing show
  "Flushing" while linking to an area page that matches nothing.

  Deliberately scoped to Queens. Elsewhere City is the town of record
  (Hempstead, Brookhaven) and PostalCity the village within it (Levittown,
  Shirley) — both legitimate, and swapping them would redraw every Nassau
  and Suffolk area page.
*/
function resolveCity(record: any): string | null {
  const city = record.City ?? null;
  if (record.CountyOrParish !== "Queens") return city;
  return record.PostalCity ?? (city === "New York" ? "Queens" : (city ?? "Queens"));
}

/*
  THE MAPPER — RESO field names → our column names.
  This is the ONLY place that knows MLS Grid's vocabulary. If they rename
  a field, this function changes and nothing else does.
*/
function mapProperty(record: any) {
  return {
    listingKey: record.ListingKey,
    listingId: record.ListingId,
    listPrice: record.ListPrice ?? null,
    bedroomsTotal: record.BedroomsTotal ?? null,
    bathroomsTotal: record.BathroomsTotalInteger ?? null,
    livingArea: record.LivingArea ?? null,
    lotSizeSquareFeet: record.LotSizeSquareFeet ?? null,
    yearBuilt: record.YearBuilt ?? null,
    publicRemarks: record.PublicRemarks ?? null,
    propertyType: record.PropertyType ?? null,
    propertySubType: record.PropertySubType ?? null,
    standardStatus: record.StandardStatus ?? null,
    unparsedAddress: record.UnparsedAddress ?? null,
    city: resolveCity(record),
    stateOrProvince: record.StateOrProvince ?? null,
    postalCode: record.PostalCode ?? null,
    countyOrParish: record.CountyOrParish ?? null,
    listAgentFullName: record.ListAgentFullName ?? null,
    listAgentMlsId: record.ListAgentMlsId ?? null,
    listOfficeName: record.ListOfficeName ?? null,
    listOfficeMlsId: record.ListOfficeMlsId ?? null,
    internetEntireListingDisplayYN: record.InternetEntireListingDisplayYN ?? null,
    internetAddressDisplayYN: record.InternetAddressDisplayYN ?? null,
    mlgCanView: record.MlgCanView ?? null,
    modificationTimestamp: new Date(record.ModificationTimestamp),
    raw: record, // the whole thing, so we never lose data
    syncedAt: new Date(),
  };
}

/* Running totals, kept outside the loop so the error path can report and
   persist whatever progress was made before a failure. */
type Progress = {
  received: number;
  upserted: number;
  deleted: number;
  skipped: number;
  pages: number;
  outOfMarket: number;
  mediaStored: number;
  mediaSkipped: number;
  mediaReplaced: number;
  mediaFailed: number;
  bytesOriginal: number;
  bytesCompressed: number;
  /* THE HIGH-WATER MARK. The greatest ModificationTimestamp of every record
     RECEIVED — including ones we delete or skip. Tracking only stored records
     would mean anything we discard keeps coming back on every future run,
     because the watermark would never advance past it. */
  highWater: Date | null;
};


export type SyncOptions = {
  /*
    Refuse to run when there is no watermark. The cron route sets this: a full
    import is thousands of photos and hours of rate-limited downloading, far
    beyond any serverless budget. That first pass stays a local script.
  */
  incrementalOnly?: boolean;
  /* Wall-clock budget, checked before every record and every photo. */
  budgetMs?: number;
  log?: (message: string) => void;
};

export type SyncResult = Progress & {
  status: "success" | "failed" | "skipped" | "budget-exhausted";
  message?: string;
  bytesDownloaded: number;
};

export async function runSync(options: SyncOptions = {}): Promise<SyncResult> {
  const log = options.log ?? ((m: string) => console.log(m));
  const startedAt = Date.now();
  const outOfBudget = () =>
    options.budgetMs !== undefined && Date.now() - startedAt >= options.budgetMs;

  const { db } = await import("@/lib/db");

  // ── Where did we get to last time? ──────────────────────────────────────
  const [state] = await db
    .select()
    .from(syncState)
    .where(eq(syncState.resource, RESOURCE));

  const since = state?.lastModificationTimestamp ?? null;

  const progress: Progress = {
    received: 0, upserted: 0, deleted: 0, skipped: 0, pages: 0, outOfMarket: 0,
    mediaStored: 0, mediaSkipped: 0, mediaReplaced: 0, mediaFailed: 0,
    bytesOriginal: 0, bytesCompressed: 0, highWater: null,
  };

  if (!since && options.incrementalOnly) {
    const message =
      "No sync_state watermark — run the initial full import locally (npm run sync) first.";
    log(message);
    return { ...progress, status: "skipped", message, bytesDownloaded: 0 };
  }

  log(
    since
      ? `Incremental sync — records modified after ${since.toISOString()}`
      : "Full import — no previous sync state found",
  );

  /*
    Persist the outcome on every path, but only move the watermark after a
    COMPLETE pass (no nextLink left). The query has no $orderby, so records
    arrive in no particular timestamp order: after a partial pass the highest
    timestamp seen can be newer than records still on the unread pages, and
    saving it would skip them for good. A partial run (budget stop or crash)
    keeps the old watermark and the next run repeats the query. That is cheap:
    upserts are idempotent and unchanged photos are skipped, so each retry
    only does the work the last one didn't finish.
    (Resuming mid-query would need the nextLink cursor stored in sync_state,
    which is a schema change.)
  */
  async function saveState(status: "success" | "failed", complete: boolean) {
    const row = {
      resource: RESOURCE,
      // Never move the watermark backwards if a run received nothing.
      lastModificationTimestamp: complete ? (progress.highWater ?? since) : since,
      lastRunAt: new Date(),
      lastRunStatus: status,
      recordsProcessed: progress.received,
    };
    await db.insert(syncState).values(row).onConflictDoUpdate({
      target: syncState.resource,
      set: row,
    });
  }

  try {
    let url: string | undefined = buildFirstPageUrl(since);
    let stoppedForBudget = false;

    // ── THE PAGINATION LOOP ───────────────────────────────────────────────
    // Strictly sequential: one page in flight at a time, following their
    // nextLink until it stops coming back. Never parallelised — their Best
    // Practices forbid concurrent requests.
    while (url && !stoppedForBudget) {
      const page: MlsGridPage = await fetchPage(url);
      const records = page.value ?? [];
      progress.pages += 1;

      let pageUpserts = 0;
      let pageDeletes = 0;

      for (const record of records) {
        /*
          Budget check per record, not per page: a page of new listings can
          carry hundreds of photo downloads, far past a 300s function ceiling.
          Stopping here is safe because the watermark doesn't move on a
          partial pass (see saveState).
        */
        if (outOfBudget()) {
          stoppedForBudget = true;
          break;
        }
        progress.received += 1;

        // Track the timestamp FIRST — before any decision to store, delete,
        // or skip this record — so the watermark covers everything received.
        const modified = new Date(record.ModificationTimestamp);
        if (!Number.isNaN(modified.getTime())) {
          if (!progress.highWater || modified > progress.highWater) {
            progress.highWater = modified;
          }
        }

        // A record with no key can't be stored or deleted; count it and move on.
        if (!record.ListingKey) {
          progress.skipped += 1;
          continue;
        }

        /*
          MARKET GATE. The API won't filter on county (see ALLOWED_COUNTIES),
          so we drop out-of-market records here — deliberately AFTER the
          watermark update above, so their timestamps still count and we don't
          re-request them forever, and BEFORE the upsert and any photo
          download, which is where the bandwidth and storage actually go.
        */
        if (!isInMarket(record.CountyOrParish)) {
          progress.outOfMarket += 1;
          continue;
        }

        if (record.MlgCanView === false) {
          // DELETION. property_media rows go with it via the FK's ON DELETE
          // CASCADE (verified against the live database).
          await db
            .delete(properties)
            .where(eq(properties.listingKey, record.ListingKey));
          progress.deleted += 1;
          pageDeletes += 1;
          continue;
        }

        const row = mapProperty(record);
        await db.insert(properties).values(row).onConflictDoUpdate({
          target: properties.listingKey,
          set: row,
        });
        progress.upserted += 1;
        pageUpserts += 1;

        // Photos arrive on the same payload via $expand=Media.
        await syncMediaForProperty(db, row.listingKey, record.Media, progress, outOfBudget);
      }

      log(
        `  page ${progress.pages}: ${records.length} received ` +
          `(${pageUpserts} upserted, ${pageDeletes} deleted) — ` +
          `${progress.received} total so far | out-of-market: ${progress.outOfMarket} | ` +
          `photos: ${progress.mediaStored} stored, ${progress.mediaSkipped} unchanged, ` +
          `${progress.mediaReplaced} replaced, ${progress.mediaFailed} failed | ` +
          `${formatBytes(totalBytesDownloaded)} downloaded`,
      );

      // The cursor for the next page. Absent → we've reached the end.
      url = page["@odata.nextLink"];
      if (url && outOfBudget()) stoppedForBudget = true;
    }

    if (stoppedForBudget) {
      log(
        `  time budget reached after ${progress.pages} page(s) — stopping cleanly; ` +
          `watermark stays at ${since?.toISOString() ?? "none"} and the next run repeats the query`,
      );
    }
    const complete = !stoppedForBudget;
    await saveState("success", complete);
    log(
      `Done. ${progress.pages} page(s), ${progress.received} received: ` +
        `${progress.upserted} upserted, ${progress.deleted} deleted, ${progress.skipped} skipped.`,
    );
    log(
      `Out-of-market records skipped (county not in ${ALLOWED_COUNTIES.join("/")}): ${progress.outOfMarket}`,
    );
    const saved = progress.bytesOriginal - progress.bytesCompressed;
    const pct = progress.bytesOriginal
      ? Math.round((saved / progress.bytesOriginal) * 100)
      : 0;
    log(
      `Photos: ${progress.mediaStored} stored, ${progress.mediaSkipped} unchanged (no re-download), ` +
        `${progress.mediaReplaced} replaced, ${progress.mediaFailed} failed.`,
    );
    log(
      `Compression: ${formatBytes(progress.bytesOriginal)} downloaded → ` +
        `${formatBytes(progress.bytesCompressed)} stored (−${pct}%, saved ${formatBytes(saved)}).`,
    );
    if (complete && progress.highWater) {
      log(`Watermark now ${progress.highWater.toISOString()}`);
    }

    return {
      ...progress,
      status: stoppedForBudget ? "budget-exhausted" : "success",
      bytesDownloaded: totalBytesDownloaded,
    };
  } catch (err) {
    /*
      Everything processed before this point is already committed. The
      watermark stays where it was (a partial pass, see saveState), so the
      next run repeats the query; rows already stored are re-upserted and
      photos already held are skipped, so no download is repeated.
    */
    await saveState("failed", false);
    console.error(
      `Sync failed after ${progress.pages} page(s), ${progress.received} record(s).`,
    );
    console.error(
      `Watermark unchanged (${since?.toISOString() ?? "none"}) — next run repeats the query.`,
    );
    throw err;
  }
}

