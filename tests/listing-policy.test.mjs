import assert from "node:assert/strict";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { publicListingConditions, rawText } from "../lib/listing-policy.ts";
import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) return next(new URL("../" + specifier.slice(2) + ".ts", import.meta.url).href, context);
    return next(specifier, context);
  },
});
const { toPositiveInt, buildHref } = await import("../lib/listing-search.ts");
test("the common SQL condition enforces IDX array permission and public booleans", () => {
  const compiled = new PgDialect().sqlToQuery(publicListingConditions);
  assert.match(compiled.sql, /jsonb_typeof.*MlgCanUse/);
  assert.match(compiled.sql, /'array'/);
  assert.match(compiled.sql, /MlgCanUse.*@>.*\["IDX"\]/);
  assert.match(compiled.sql, /"mlg_can_view"/);
  assert.match(compiled.sql, /"internet_entire_listing_display_yn"/);
  assert.deepEqual(compiled.params, [true, true, "Active", "Active Under Contract", "Pending", "Coming Soon"]);
  assert.match(compiled.sql, /OnMarketDate/);
});
test("source field helpers ignore missing, empty and non-text fields", () => {
  assert.equal(rawText({ Contact: "  office@example.com " }, "Contact"), "office@example.com");
  for (const v of [undefined, null, 42, {}, [], " "]) assert.equal(rawText({ Contact: v }, "Contact"), undefined);
});
test("unsafe, fractional and nondecimal SQL filter numbers are rejected", () => {
  for (const v of ["9".repeat(50), "1e6", "0x10", "-1", "2.1", "Infinity", "2147483648", ""]) {
    assert.equal(toPositiveInt(v), undefined, v);
  }
  assert.equal(toPositiveInt("300000"), 300000);
  assert.equal(toPositiveInt("0"), 0);
  assert.equal(toPositiveInt(["3", "4"]), 3);
  assert.equal(buildHref("/buy", {city:"Franklin Square",dealType:"sale",minBeds:0}, 2), "/buy?dealType=sale&city=Franklin+Square&minBeds=0&page=2");
});

const { formatPrice } = await import("../data/listings.ts");
test("missing or invalid price never advertises a free home", () => {
  for (const value of [0, -1, NaN, Infinity]) assert.equal(formatPrice(value, "sale"), "Price on request");
  assert.equal(formatPrice(3500, "rent"), "$3,500/mo");
});
