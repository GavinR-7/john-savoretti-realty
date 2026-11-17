import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { registerHooks } from "node:module";

const fixtureModules = {
  "server-only": "",
  "drizzle-orm": `
    export const eq = (column, value) => ({ op: "eq", column, value });
    export const inArray = (column, values) => ({ op: "in", column, values });
    export const lte = (column, value) => ({ op: "lte", column, value });
    export const isNull = column => ({ op: "null", column });
    export const and = (...conditions) => ({ op: "and", conditions });
    export const or = (...conditions) => ({ op: "or", conditions });
    export const sql = (parts, ...values) => ({ text: parts.join("?"), values });
  `,
  "@/lib/db/schema": `
    const table = (name, fields) => Object.fromEntries([
      ["name", name], ...fields.map(field => [field, name + "." + field]),
    ]);
    export const properties = table("properties", ["listingKey", "modificationTimestamp"]);
    export const propertyMedia = table("media", ["listingKey", "mediaKey", "mediaModificationTimestamp", "localUrl", "order"]);
    export const syncState = table("state", ["resource", "leaseOwner", "leaseExpiresAt", "lastModificationTimestamp"]);
    export const mediaCleanup = table("cleanup", ["blobUrl", "listingKey", "queuedAt"]);
  `,
  "@/lib/db": `
    export const db = new Proxy({}, { get: (_, key) =>
      (...args) => globalThis.__syncFixture.db[key](...args) });
  `,
  "@vercel/blob": `
    export const put = async (...args) => globalThis.__syncFixture.put(...args);
    export const del = async (...args) => globalThis.__syncFixture.del(...args);
  `,
  sharp: `
    export default () => ({
      rotate() { return this; }, resize() { return this; },
      webp() { return this; }, async toBuffer() { return Buffer.from("compressed"); },
    });
  `,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(fixtureModules, specifier)) {
      return { url: "sync-fixture:" + specifier, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("sync-fixture:")) {
      return { format: "module", source: fixtureModules[url.slice("sync-fixture:".length)], shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

process.env.MLSGRID_API_URL = "https://mls.example.invalid/v2";
process.env.MLSGRID_TOKEN = "synthetic-test-token";
const modulePath = process.env.SYNC_TEST_MODULE
  ? new URL(process.env.SYNC_TEST_MODULE)
  : new URL("../lib/mls/sync.ts", import.meta.url);
const { runSync } = await import(modulePath.href);

const SINCE = new Date("2026-01-01T00:00:00.000Z");
const MODIFIED = "2026-01-02T00:00:00.000Z";
const property = (changes = {}) => ({
  ListingKey: "KEY-1", ListingId: "KEY100", ModificationTimestamp: MODIFIED,
  MlgCanView: true, MlgCanUse: ["IDX"],
  InternetEntireListingDisplayYN: true, InternetAddressDisplayYN: true,
  CountyOrParish: "Nassau County", City: "Franklin Square", Media: [], ...changes,
});
const photo = (changes = {}) => ({
  MediaKey: "PHOTO-1", Permission: ["Public"], Order: 1,
  MediaModificationTimestamp: MODIFIED,
  MediaURL: "https://photos.example.invalid/token=private&expires=123/images/photo.jpeg?secret=private",
  ...changes,
});
const storedPhoto = (changes = {}) => ({
  mediaKey: "PHOTO-1", listingKey: "KEY-1", order: 1,
  mediaModificationTimestamp: new Date(MODIFIED), localUrl: "https://blob.example.invalid/photo.webp",
  ...changes,
});
let fixture;
let clock = 0;

function valueOf(value, row = {}) {
  if (!value?.text) return value;
  if (value.text.includes("interval '120 seconds'")) return new Date(clock + 120_000);
  if (value.text === "clock_timestamp()") return new Date(clock);
  if (value.text.startsWith("greatest(")) {
    const candidate = value.values[1];
    return candidate && (!row.lastModificationTimestamp || candidate > row.lastModificationTimestamp)
      ? candidate : row.lastModificationTimestamp;
  }
  throw new Error("Unknown fixture SQL " + value.text);
}

function matches(row, condition) {
  if (condition.op === "and") return condition.conditions.every(item => matches(row, item));
  if (condition.op === "or") return condition.conditions.some(item => matches(row, item));
  const column = condition.column.split(".").at(-1);
  if (condition.op === "null") return row[column] == null;
  if (condition.op === "in") return condition.values.includes(row[column]);
  const expected = valueOf(condition.value, row);
  return condition.op === "lte" ? row[column] <= expected : row[column] === expected;
}

function lazy(execute) {
  return { then(resolve, reject) { return Promise.resolve().then(execute).then(resolve, reject); } };
}

function makeFixture(records, media = [], properties = []) {
  const data = {
    properties: structuredClone(properties), media: structuredClone(media), cleanup: [],
    state: [{ resource: "Property", lastModificationTimestamp: SINCE, lastRunStatus: "success",
      leaseOwner: null, leaseExpiresAt: null }],
  };
  const actions = [];
  let nextPages = [{ value: records }];
  const database = {
    select(fields) {
      return {
        from(table) {
          let condition, maximum = Infinity;
          const query = lazy(() => data[table.name].filter(row => !condition || matches(row, condition))
            .slice(0, maximum).map(row => fields
              ? Object.fromEntries(Object.entries(fields).map(([alias, column]) => [alias, row[column.split(".").at(-1)]]))
              : { ...row }));
          query.where = (value) => { condition = value; return query; };
          query.limit = (value) => { maximum = value; return query; };
          return query;
        },
      };
    },
    insert(table) {
      return {
        values(row) {
          let conflict, returning;
          const query = lazy(() => {
            const key = { properties: "listingKey", media: "mediaKey", state: "resource", cleanup: "blobUrl" }[table.name];
            const index = data[table.name].findIndex(item => item[key] === row[key]);
            if (index >= 0 && (conflict?.nothing || conflict?.setWhere && !matches(data[table.name][index], conflict.setWhere))) {
              return [];
            }
            const previous = index >= 0 ? data[table.name][index] : {};
            const values = index >= 0 ? conflict.set : row;
            const next = { ...previous, ...Object.fromEntries(Object.entries(values).map(([key, value]) =>
              [key, valueOf(value, previous)])) };
            if (index < 0) data[table.name].push(next);
            else data[table.name][index] = next;
            actions.push({ kind: "upsert", table: table.name, key: row[key] });
            return returning ? [Object.fromEntries(Object.entries(returning).map(([alias, column]) =>
              [alias, next[column.split(".").at(-1)]]))] : [];
          });
          query.onConflictDoUpdate = value => { conflict = value; return query; };
          query.onConflictDoNothing = () => { conflict = { nothing: true }; return query; };
          query.returning = value => { returning = value; return query; };
          return query;
        },
      };
    },
    delete(table) {
      return {
        where(condition) {
          return lazy(() => {
            const removed = data[table.name].filter(row => matches(row, condition));
            data[table.name] = data[table.name].filter(row => !matches(row, condition));
            if (table.name === "properties") {
              data.media = data.media.filter(row => !removed.some(item => item.listingKey === row.listingKey));
            }
            actions.push({ kind: "delete", table: table.name, count: removed.length });
          });
        },
      };
    },
    update(table) {
      return {
        set(values) {
          return {
            where(condition) {
              return lazy(() => {
                for (const row of data[table.name].filter(row => matches(row, condition))) {
                  for (const [key, value] of Object.entries(values)) row[key] = valueOf(value, row);
                }
              });
            },
          };
        },
      };
    },
    execute(query) {
      return lazy(() => {
        assert.ok(query.text.includes("WITH renewed") && query.text.includes("count(*)::integer"));
        const owner = query.values.find(value => typeof value === "string" && /^[a-f0-9-]{36}$/.test(value));
        const state = data.state.find(row => row.resource === "Property");
        if (state.leaseOwner !== owner || !state.leaseExpiresAt || state.leaseExpiresAt.getTime() <= clock) {
          throw new Error("Sync lease lost");
        }
        state.leaseExpiresAt = new Date(clock + 120_000);
        return { rows: [{ fenced: 1 }] };
      });
    },
    async batch(queries) {
      const backup = structuredClone(data);
      const oldActions = actions.length;
      try {
        const result = [];
        for (const query of queries) result.push(await query);
        return result;
      } catch (error) {
        for (const key of Object.keys(data)) data[key] = backup[key];
        actions.length = oldActions;
        throw error;
      }
    },
  };
  return {
    data, actions,
    page: () => nextPages.shift(),
    setPages: (pages) => { nextPages = pages; },
    db: database,
    async put(name) {
      actions.push({ kind: "blob-put", name });
      return { url: "https://blob.example.invalid/" + name };
    },
    async del(url) {
      actions.push({ kind: "blob-delete", url });
    },
  };
}

beforeEach(() => {
  clock += 10_000;
  fixture = makeFixture([]);
  globalThis.__syncFixture = fixture;
  mock.method(Date, "now", () => clock);
  mock.method(globalThis, "setTimeout", (callback, milliseconds) => {
    clock += Number(milliseconds);
    callback();
    return 0;
  });
  mock.method(console, "log", () => {});
  mock.method(console, "warn", () => {});
  mock.method(console, "error", () => {});
  mock.method(globalThis, "fetch", async (url) => {
    if (!String(url).startsWith("https://mls.example.invalid/")) {
      throw new Error("unexpected synthetic request");
    }
    return Response.json(fixture.page());
  });
});

afterEach(() => {
  mock.restoreAll();
  delete globalThis.__syncFixture;
});

function install(records, media = [], properties = []) {
  fixture = makeFixture(records, media, properties);
  globalThis.__syncFixture = fixture;
}

const run = (options = {}) => runSync({ log: () => {}, ...options });

test("county-less tombstone withdraws the existing property and its media", async () => {
  install([property({ MlgCanView: false, CountyOrParish: undefined, Media: undefined })],
    [storedPhoto()], [{ listingKey: "KEY-1" }]);
  const result = await run();
  assert.equal(result.deleted, 1);
  assert.equal(fixture.data.properties.length, 0);
  assert.equal(fixture.data.media.length, 0);
  assert.ok(fixture.actions.some(action => action.kind === "blob-delete"));
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), MODIFIED);
});

test("a county move removes an old in-market listing without a photo download", async () => {
  install([property({ CountyOrParish: "Westchester County" })],
    [storedPhoto()], [{ listingKey: "KEY-1" }]);
  const result = await run();
  assert.equal(result.outOfMarket, 1);
  assert.equal(fixture.data.properties.length, 0);
  assert.equal(fixture.data.media.length, 0);
  assert.equal(fixture.actions.filter(action => action.kind === "blob-put").length, 0);
});

test("an empty or revoked media expansion prunes old references and blobs", async () => {
  for (const media of [[], [photo({ Permission: ["Private"] })]]) {
    install([property({ Media: media })], [storedPhoto()]);
    const result = await run();
    assert.equal(result.status, "success");
    assert.equal(fixture.data.media.length, 0);
    assert.ok(fixture.actions.some(action => action.kind === "blob-delete"));
  }
});

test("unchanged public photos preserve the bytes and update their display order", async () => {
  install([property({ Media: [photo({ Order: 4 })] })], [storedPhoto()]);
  const result = await run();
  assert.equal(result.mediaSkipped, 1);
  assert.equal(fixture.data.media[0].order, 4);
  assert.equal(fixture.actions.filter(action => action.kind.startsWith("blob-")).length, 0);
});

test("missing media expansion fails and keeps the watermark for retry", async () => {
  install([property({ Media: undefined })], [storedPhoto()]);
  await assert.rejects(run(), /media expansion/);
  assert.equal(fixture.data.media.length, 1);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
  assert.equal(fixture.data.state[0].lastRunStatus, "failed");
});

test("last-record photo budget exhaustion cannot complete the cursor", async () => {
  install([property({ Media: [photo(), photo({ MediaKey: "PHOTO-2" })] })]);
  mock.method(globalThis, "fetch", async (url) => {
    if (String(url).startsWith("https://mls.example.invalid/")) return Response.json(fixture.page());
    clock += 2_000;
    return new Response("synthetic image");
  });
  const result = await run({ budgetMs: 1_500 });
  assert.equal(result.status, "budget-exhausted");
  assert.equal(result.mediaStored, 1);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
  assert.equal(fixture.data.state[0].lastRunStatus, "failed");
});

test("failed photo work retains the cursor and a later run retries with a fresh page", async () => {
  install([property({ Media: [photo()] })]);
  mock.method(globalThis, "fetch", async (url) => String(url).startsWith("https://mls.example.invalid/")
    ? Response.json(fixture.page()) : new Response("", { status: 429 }));
  await assert.rejects(run(), /watermark was retained/);
  assert.equal(fixture.data.state[0].lastRunStatus, "failed");
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());

  fixture.setPages([{ value: [property({ Media: [photo({ MediaURL: "https://photos.example.invalid/fresh" })] })] }]);
  const requests = [];
  mock.method(globalThis, "fetch", async (url) => {
    requests.push(String(url));
    return String(url).startsWith("https://mls.example.invalid/")
      ? Response.json(fixture.page()) : new Response("synthetic image");
  });
  const result = await run();
  assert.equal(result.mediaStored, 1);
  assert.ok(requests.includes("https://photos.example.invalid/fresh"));
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), MODIFIED);
});

test("signed photo URLs are excluded from raw rows, stored provenance and logs", async () => {
  install([property({ Media: [photo()] })]);
  mock.method(globalThis, "fetch", async (url) => String(url).startsWith("https://mls.example.invalid/")
    ? Response.json(fixture.page()) : new Response("synthetic image"));
  await run();
  const row = fixture.data.properties[0];
  assert.equal(row.raw.Media[0].MediaURL, undefined);
  const source = fixture.data.media[0].sourceUrl;
  assert.ok(!source.includes("private"));
  assert.ok(!source.includes("secret"));
  assert.equal(source, "https://photos.example.invalid/images/photo.jpeg");
});

test("a failed page never advances the watermark", async () => {
  install([]);
  mock.method(globalThis, "fetch", async () => new Response("private payload", { status: 500 }));
  await assert.rejects(run(), error => !error.message.includes("private payload"));
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
  assert.equal(fixture.data.state[0].lastRunStatus, "failed");
});

test("failed revoked Blob deletion retains durable cleanup and the next run retries it", async () => {
  const url = storedPhoto().localUrl;
  install([property({ Media: [] })], [storedPhoto()]);
  let attempts = 0;
  fixture.del = async (candidate) => {
    assert.equal(candidate, url);
    attempts += 1;
    throw new Error("synthetic deletion failure");
  };
  await assert.rejects(run(), /watermark was retained/);
  assert.equal(fixture.data.media.length, 0);
  assert.deepEqual(fixture.data.cleanup.map(row => row.blobUrl), [url]);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
  assert.equal(fixture.data.state[0].lastRunStatus, "failed");

  fixture.del = async (candidate) => {
    assert.equal(candidate, url);
    attempts += 1;
  };
  fixture.setPages([{ value: [property({ Media: [] })] }]);
  assert.equal((await run()).status, "success");
  assert.equal(attempts, 2);
  assert.equal(fixture.data.cleanup.length, 0);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), MODIFIED);
});

test("withdrawal cleanup survives the property media cascade when Blob deletion fails", async () => {
  const url = storedPhoto().localUrl;
  install([property({ MlgCanView: false, CountyOrParish: undefined, Media: undefined })],
    [storedPhoto()], [{ listingKey: "KEY-1" }]);
  fixture.del = async () => { throw new Error("synthetic deletion failure"); };
  await assert.rejects(run(), /watermark was retained/);
  assert.equal(fixture.data.properties.length, 0);
  assert.equal(fixture.data.media.length, 0);
  assert.equal(fixture.data.cleanup[0].blobUrl, url);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
});

test("an active database lease rejects a second CLI or cron caller before its feed request", async () => {
  install([property()]);
  let pageCalls = 0, releasePage, pageStarted;
  const started = new Promise(resolve => { pageStarted = resolve; });
  mock.method(globalThis, "fetch", async () => {
    pageCalls += 1;
    pageStarted();
    return new Promise(resolve => { releasePage = () => resolve(Response.json(fixture.page())); });
  });
  const first = run();
  await started;
  const owner = fixture.data.state[0].leaseOwner;
  assert.ok(owner);
  const second = await run({ incrementalOnly: true });
  assert.equal(second.status, "skipped");
  assert.match(second.message, /database lease/);
  assert.equal(pageCalls, 1);
  assert.equal(fixture.data.state[0].leaseOwner, owner);
  releasePage();
  assert.equal((await first).status, "success");
  assert.equal(fixture.data.state[0].leaseOwner, null);
});

test("an expired owner cannot restore a listing or regress a newer owner's watermark", async () => {
  install([], [], [{ listingKey: "KEY-1", modificationTimestamp: SINCE }]);
  let pageCalls = 0, releaseOldPage, pageStarted;
  const started = new Promise(resolve => { pageStarted = resolve; });
  mock.method(globalThis, "fetch", async () => {
    pageCalls += 1;
    if (pageCalls === 1) {
      pageStarted();
      return new Promise(resolve => {
        releaseOldPage = () => resolve(Response.json({ value: [property()] }));
      });
    }
    return Response.json({ value: [property({
      MlgCanView: false, CountyOrParish: undefined, Media: undefined,
      ModificationTimestamp: "2026-01-03T00:00:00.000Z",
    })] });
  });
  const oldRun = run();
  await started;
  const oldOwner = fixture.data.state[0].leaseOwner;
  clock += 120_001;
  const newer = await run();
  assert.equal(newer.status, "success");
  assert.equal(fixture.data.properties.length, 0);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), "2026-01-03T00:00:00.000Z");
  releaseOldPage();
  await assert.rejects(oldRun, /lease lost/);
  assert.equal(fixture.data.properties.length, 0);
  assert.equal(fixture.data.media.length, 0);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), "2026-01-03T00:00:00.000Z");
  assert.equal(fixture.data.state[0].lastRunStatus, "success");
  assert.equal(fixture.data.state[0].leaseOwner, null);
  assert.equal(fixture.actions.filter(action => action.kind === "upsert" &&
    action.table === "properties").length, 0);
  assert.ok(oldOwner);
});

test("a stale post-upload attachment is fenced and its unique Blob is queued for cleanup", async () => {
  install([property({ Media: [photo()] })]);
  mock.method(globalThis, "fetch", async (url) => String(url).startsWith("https://mls.example.invalid/")
    ? Response.json(fixture.page()) : new Response("synthetic image"));
  const newerOwner = "11111111-2222-3333-4444-555555555555";
  let uploadedName;
  fixture.put = async (name, _bytes, options) => {
    uploadedName = name;
    assert.equal(options.allowOverwrite, false);
    assert.match(name, /PHOTO-1-[a-f0-9-]{36}\.webp$/);
    clock += 120_001;
    fixture.data.state[0].leaseOwner = newerOwner;
    fixture.data.state[0].leaseExpiresAt = new Date(clock + 120_000);
    return { url: "https://blob.example.invalid/" + name };
  };
  await assert.rejects(run(), /watermark was retained/);
  assert.equal(fixture.data.media.length, 0);
  assert.equal(fixture.data.cleanup[0].blobUrl, "https://blob.example.invalid/" + uploadedName);
  assert.equal(fixture.data.state[0].leaseOwner, newerOwner);
  assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());

  // A genuine later lease drains the unreferenced unique upload.
  fixture.data.state[0].leaseOwner = null;
  fixture.data.state[0].leaseExpiresAt = null;
  fixture.setPages([{ value: [] }]);
  assert.equal((await run()).status, "success");
  assert.equal(fixture.data.cleanup.length, 0);
  assert.ok(fixture.actions.some(action => action.kind === "blob-delete" &&
    action.url === "https://blob.example.invalid/" + uploadedName));
});

test("an ambiguous-commit cleanup record cannot delete an actively referenced Blob", async () => {
  install([property({ Media: [photo()] })], [storedPhoto()]);
  fixture.data.cleanup.push({ blobUrl: storedPhoto().localUrl, listingKey: "KEY-1" });
  assert.equal((await run()).status, "success");
  assert.equal(fixture.data.cleanup.length, 0);
  assert.equal(fixture.data.media[0].localUrl, storedPhoto().localUrl);
  assert.equal(fixture.actions.filter(action => action.kind === "blob-delete").length, 0);
});

test("a stale-owner release does not clear a replacement owner's active lease", async () => {
  install([]);
  let releasePage, pageStarted;
  const started = new Promise(resolve => { pageStarted = resolve; });
  mock.method(globalThis, "fetch", async () => {
    pageStarted();
    return new Promise(resolve => { releasePage = () => resolve(Response.json({ value: [] })); });
  });
  const pending = run();
  await started;
  const replacementOwner = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  fixture.data.state[0].leaseOwner = replacementOwner;
  fixture.data.state[0].leaseExpiresAt = new Date(clock + 120_000);
  releasePage();
  await assert.rejects(pending, /lease lost/);
  assert.equal(fixture.data.state[0].leaseOwner, replacementOwner);
});

for (const [name, revoked] of [
  ["IDX rights are lost", { MlgCanUse: ["VOW"] }],
  ["IDX rights are absent", { MlgCanUse: undefined }],
  ["whole-listing display consent is revoked", { InternetEntireListingDisplayYN: false }],
]) {
  test(name + ": public photo rows are removed without any upload", async () => {
    install([property({ ...revoked, Media: [photo(), photo({ MediaKey: "PHOTO-NEW" })] })], [storedPhoto()]);
    assert.equal((await run()).status, "success");
    assert.equal(fixture.data.media.length, 0);
    assert.equal(fixture.data.cleanup.length, 0);
    assert.ok(fixture.actions.some(action => action.kind === "blob-delete" &&
      action.url === storedPhoto().localUrl));
    assert.equal(fixture.actions.filter(action => action.kind === "blob-put").length, 0);
    assert.equal(fixture.data.properties[0].internetEntireListingDisplayYN,
      revoked.InternetEntireListingDisplayYN ?? true);
    assert.deepEqual(fixture.data.properties[0].raw.MlgCanUse,
      Object.hasOwn(revoked, "MlgCanUse") ? revoked.MlgCanUse : ["IDX"]);
  });

  test(name + ": failed Blob deletion keeps cleanup retryable and the prior watermark", async () => {
    install([property({ ...revoked, Media: [photo()] })], [storedPhoto()]);
    fixture.del = async () => { throw new Error("synthetic deletion failure"); };
    await assert.rejects(run(), /watermark was retained/);
    assert.equal(fixture.data.media.length, 0);
    assert.equal(fixture.data.cleanup[0].blobUrl, storedPhoto().localUrl);
    assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), SINCE.toISOString());
    assert.equal(fixture.data.state[0].lastRunStatus, "failed");
    assert.equal(fixture.actions.filter(action => action.kind === "blob-put").length, 0);

    fixture.del = async (url) => {
      fixture.actions.push({ kind: "blob-delete", url });
    };
    fixture.setPages([{ value: [property({ ...revoked, Media: [photo()] })] }]);
    assert.equal((await run()).status, "success");
    assert.equal(fixture.data.cleanup.length, 0);
    assert.equal(fixture.data.media.length, 0);
    assert.equal(fixture.data.state[0].lastModificationTimestamp.toISOString(), MODIFIED);
  });
}
