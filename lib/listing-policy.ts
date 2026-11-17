import { and, eq, inArray, sql } from "drizzle-orm";
import { properties } from "./db/schema.ts";

// All public queries, including metadata and sitemap, share this permission gate.
export const publicListingConditions = and(
  eq(properties.mlgCanView, true),
  eq(properties.internetEntireListingDisplayYN, true),
  sql`jsonb_typeof(${properties.raw}->'MlgCanUse') = 'array'`,
  sql`${properties.raw}->'MlgCanUse' @> '["IDX"]'::jsonb`,
  inArray(properties.standardStatus, ["Active", "Active Under Contract", "Pending", "Coming Soon"]),
  sql`(${properties.standardStatus} <> 'Coming Soon' OR ${properties.raw}->>'OnMarketDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}')`,
);

export function rawText(raw: Record<string, unknown>, field: string): string | undefined {
  const value = raw[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
