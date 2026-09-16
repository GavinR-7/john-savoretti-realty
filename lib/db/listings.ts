/*
  DATA ACCESS LAYER — the only file that knows Postgres exists.

  Everything above this (pages, components) asks for `Listing` objects and
  doesn't care where they come from. That's what makes swapping the data
  source a one-line change at each call site instead of a rewrite.
*/

import { db } from "@/lib/db";
import { properties, propertyMedia, type PropertyRow, type MediaRow } from "@/lib/db/schema";
import { eq, and, desc, asc, sql, gte, lte, count, inArray } from "drizzle-orm";
import type { Listing } from "@/data/listings";

// MLS Grid prefixes Key/Id fields (KEYL2461951). Required when requesting,
// MUST be stripped before public display. Compliance rule, not cosmetic.
function stripPrefix(value: string): string {
  return value.replace(/^KEY/, "");
}

// Turn a town name into our slug format ("Franklin Square" → "franklin-square")
// so listings can link to the area pages we already built.
//
// Returns undefined when the row has no City. It used to fall back to
// "long-island", which produced a link to /areas/long-island — a page that
// has never existed, so every city-less listing shipped a guaranteed 404.
// Callers render the area link conditionally instead.
export function toAreaSlug(city: string | null): string | undefined {
  if (!city) return undefined;
  return city.toLowerCase().replace(/\s+/g, "-");
}

// PropertyType tells us what kind of transaction this is.
function toDealType(propertyType: string | null): Listing["dealType"] {
  if (!propertyType) return "sale";
  const t = propertyType.toLowerCase();
  if (t.includes("lease") || t.includes("rental")) return "rent";
  if (t.includes("commercial") || t.includes("business")) return "commercial";
  return "sale";
}

// RESO's StandardStatus vocabulary → the labels we show visitors.
function toStatus(
  standardStatus: string | null,
  dealType: Listing["dealType"],
): Listing["status"] {
  switch (standardStatus) {
    case "Active":
      return dealType === "rent" ? "For rent" : "For sale";
    case "Active Under Contract":
    case "Pending":
      return "Pending";
    case "Coming Soon":
      return "Coming soon";
    default:
      return dealType === "rent" ? "For rent" : "For sale";
  }
}

/*
  THE MAPPER — a database row becomes a Listing.
  Every field your components expect gets produced here.
*/
function rowToListing(row: PropertyRow, media: MediaRow[] = []): Listing {
  const dealType = toDealType(row.propertyType);

  // Photos arrive pre-sorted by `order`; the first is the cover shot and the
  // rest are the gallery. A row with no photos yet leaves image as "" so
  // PropertyImage renders its "Photo coming soon" fallback.
  const photoUrls = media
    .map((m) => m.localUrl)
    .filter((url): url is string => Boolean(url));

  return {
    id: row.listingKey,
    mls: stripPrefix(row.listingId),
    city: row.city ?? "Long Island",
    areaSlug: toAreaSlug(row.city),
    price: row.listPrice ?? 0,
    dealType,
    status: toStatus(row.standardStatus, dealType),

    // ⚠️ COMPLIANCE: only expose the address when the seller allows it.
    address: row.internetAddressDisplayYN
      ? (row.unparsedAddress ?? undefined)
      : undefined,

    state: row.stateOrProvince ?? undefined,
    county: row.countyOrParish ?? undefined,
    beds: row.bedroomsTotal ?? undefined,
    baths: row.bathroomsTotal ?? undefined,
    squareFeet: row.livingArea ?? undefined,
    lotSize: row.lotSizeSquareFeet ?? undefined,
    yearBuilt: row.yearBuilt ?? undefined,
    style: row.propertySubType ?? undefined,
    description: row.publicRemarks ?? undefined,

    image: photoUrls[0] ?? "",
    gallery: photoUrls.length > 1 ? photoUrls.slice(1) : undefined,
    agentSlug: undefined,

    // ⚠️ IDX ATTRIBUTION — most listings belong to other brokerages, so the
    // listing agent and office must always be displayed. Never drop these.
    listAgentFullName: row.listAgentFullName ?? undefined,
    listAgentMlsId: row.listAgentMlsId ?? undefined,
    listOfficeName: row.listOfficeName ?? undefined,
  };
}

/*
  ── THE N+1 GUARD ─────────────────────────────────────────────────────────

  Every query below funnels through here instead of calling rows.map(rowToListing)
  directly. Mapping per-row would tempt a per-listing media lookup — 24 listings
  on /buy would mean 25 round trips.

  Instead: collect all the listing keys, fetch every photo for the whole batch
  in ONE `where listing_key in (...)` query ordered by (listing_key, order),
  bucket them into a Map, then hand each row its own slice. Two queries total,
  regardless of whether the page shows 1 listing or 1,000.
*/
async function rowsToListings(rows: PropertyRow[]): Promise<Listing[]> {
  if (rows.length === 0) return [];

  const media = await db
    .select()
    .from(propertyMedia)
    .where(inArray(propertyMedia.listingKey, rows.map((r) => r.listingKey)))
    .orderBy(asc(propertyMedia.listingKey), asc(propertyMedia.order));

  const byListing = new Map<string, MediaRow[]>();
  for (const m of media) {
    const bucket = byListing.get(m.listingKey);
    if (bucket) bucket.push(m);
    else byListing.set(m.listingKey, [m]);
  }

  return rows.map((row) => rowToListing(row, byListing.get(row.listingKey) ?? []));
}

/*
  ⚠️ COMPLIANCE FILTER — applied to EVERY query.
  A listing may only appear publicly if the seller consented and MLS Grid
  still permits distribution. This is legally binding, so it lives in one
  place that every query uses.
*/
const displayable = and(
  eq(properties.mlgCanView, true),
  eq(properties.internetEntireListingDisplayYN, true),
);

/*
  The SQL mirror of toDealType() above. That function reads a row's free-text
  PropertyType and decides sale/rent/commercial; this expresses the same rules
  as a WHERE clause so the database can do the filtering.

  Note the ordering: toDealType checks lease/rental BEFORE commercial/business,
  so "Commercial Lease" is a rental. The commercial branch below subtracts the
  rental terms to reproduce that precedence. A NULL PropertyType falls through
  to "sale" in toDealType, so the sale branch allows NULL explicitly — without
  that, `NOT ILIKE` would evaluate to NULL and silently drop those rows.
*/
const RENT_TERMS = sql`(${properties.propertyType} ILIKE '%lease%' OR ${properties.propertyType} ILIKE '%rental%')`;
const COMMERCIAL_TERMS = sql`(${properties.propertyType} ILIKE '%commercial%' OR ${properties.propertyType} ILIKE '%business%')`;

function dealTypeCondition(dealType: Listing["dealType"]) {
  switch (dealType) {
    case "rent":
      return RENT_TERMS;
    case "commercial":
      return sql`(${COMMERCIAL_TERMS} AND NOT ${RENT_TERMS})`;
    case "sale":
      return sql`(${properties.propertyType} IS NULL OR NOT (${RENT_TERMS} OR ${COMMERCIAL_TERMS}))`;
  }
}

export async function getAllListings(limit = 50): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(displayable)
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}

export async function getSaleListings(limit = 15): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, dealTypeCondition("sale")))
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}

export async function getRentalListings(limit = 24): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, dealTypeCondition("rent")))
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}

export async function getCommercialListings(limit = 24): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, dealTypeCondition("commercial")))
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}

export async function getListingByMls(mls: string): Promise<Listing | null> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, eq(properties.listingId, `KEY${mls}`)))
    .limit(1);
  return rows[0] ? (await rowsToListings(rows))[0] : null;
}

export async function getAllListingMlsNumbers(): Promise<string[]> {
  const rows = await db
    .select({ listingId: properties.listingId })
    .from(properties)
    .where(displayable);
  return rows.map((r) => stripPrefix(r.listingId));
}

export async function getCitiesWithListings(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: properties.city })
    .from(properties)
    .where(displayable);
  return rows
    .map((r) => r.city)
    .filter((city): city is string => city !== null);
}

export async function getListingsByCity(city: string, limit = 12): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, eq(properties.city, city)))
    .limit(limit);
  return rowsToListings(rows);
}

/* ───────────────────────── PROPERTY SEARCH (/buy) ─────────────────────────

  The search page filters in SQL rather than in the browser: with a full IDX
  feed this table holds tens of thousands of rows, so we never ship more than
  one page of them to the client.
*/

export type ListingSearchFilters = {
  city?: string;
  minBeds?: number;
  minBaths?: number;
  minPrice?: number;
  maxPrice?: number;
  dealType?: Listing["dealType"];
};

export const LISTINGS_PER_PAGE = 24;

/*
  ONE where-clause builder, shared by the results query and the count query.
  If these two ever drifted apart the pagination maths would lie about how
  many matches there are, so they deliberately read from the same function.
  `displayable` is folded in here, so no search query can skip it.
*/
function searchConditions(filters: ListingSearchFilters) {
  const conditions = [displayable];

  if (filters.city) conditions.push(eq(properties.city, filters.city));
  if (filters.minBeds !== undefined) conditions.push(gte(properties.bedroomsTotal, filters.minBeds));
  if (filters.minBaths !== undefined) conditions.push(gte(properties.bathroomsTotal, filters.minBaths));
  if (filters.minPrice !== undefined) conditions.push(gte(properties.listPrice, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(properties.listPrice, filters.maxPrice));
  if (filters.dealType) conditions.push(dealTypeCondition(filters.dealType));

  return and(...conditions);
}

export async function searchListings(
  filters: ListingSearchFilters,
  page = 1,
): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(searchConditions(filters))
    .orderBy(desc(properties.listPrice))
    .limit(LISTINGS_PER_PAGE)
    .offset((Math.max(page, 1) - 1) * LISTINGS_PER_PAGE);
  return rowsToListings(rows);
}

export async function countListings(filters: ListingSearchFilters): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(properties)
    .where(searchConditions(filters));
  return row?.total ?? 0;
}

/* ──────────────── JOHN'S OWN INVENTORY (homepage storefront) ───────────────

  The homepage is the brokerage's storefront: it shows John Savoretti Realty's
  own listings, while the whole IDX feed lives on /buy.

  ⚠️ UNVERIFIED IN THE DEMO FEED. This id does not appear in the sample data —
  it contains no office whose name mentions Savoretti at all — so every
  office-scoped query below currently returns zero rows and the callers fall
  back. That is expected: the demo feed carries other OneKey brokerages'
  sample listings, not John's. Confirm this value against the production feed
  (it should match his ListOfficeMlsId) and the storefront lights up with no
  other code change.
*/
export const OFFICE_MLS_ID = "KEYJOSV01";

export async function getOfficeListings(limit = 15): Promise<Listing[]> {
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, eq(properties.listOfficeMlsId, OFFICE_MLS_ID)))
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}

/* Towns where John's own office actually has inventory. */
export async function getOfficeCities(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: properties.city })
    .from(properties)
    .where(and(displayable, eq(properties.listOfficeMlsId, OFFICE_MLS_ID)));
  return rows
    .map((r) => r.city)
    .filter((city): city is string => Boolean(city))
    .sort();
}

/*
  One agent's listings, matched on the MLS id in data/agents.ts. Returns
  nothing while those ids are still blank, which the agent page renders as
  its existing "no active listings" state.
*/
export async function getListingsByAgentMlsId(
  mlsId: string | undefined,
  limit = 24,
): Promise<Listing[]> {
  if (!mlsId) return [];
  const rows = await db
    .select()
    .from(properties)
    .where(and(displayable, eq(properties.listAgentMlsId, mlsId)))
    .orderBy(desc(properties.listPrice))
    .limit(limit);
  return rowsToListings(rows);
}
