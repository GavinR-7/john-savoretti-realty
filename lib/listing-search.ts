/*
  Search-param plumbing shared by /buy, /rentals, and /commercial.

  Keeps the URL→filters translation in one place so the three pages can't
  drift on what "?minBeds=3" means, and so validation happens once.
*/
import type { ListingSearchFilters } from "@/lib/db/listings";

export type SearchParams = Record<string, string | string[] | undefined>;

export const DEAL_TYPES = [
  { label: "For sale", value: "sale" },
  { label: "For rent", value: "rent" },
  { label: "Commercial", value: "commercial" },
] as const;

/* A param can arrive as a string, an array (repeated key), or not at all. */
export function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function toPositiveInt(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  // Reject "abc", "-3", "2.5" and Infinity rather than passing them to SQL.
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
}

/*
  `dealType` is fixed by the route on /rentals and /commercial; only /buy
  lets the visitor choose one. Passing a fixed value ignores the param.
*/
export function parseFilters(
  params: SearchParams,
  cities: string[],
  fixedDealType?: ListingSearchFilters["dealType"],
): ListingSearchFilters {
  let dealType = fixedDealType;
  if (!dealType) {
    const raw = first(params.dealType);
    dealType = DEAL_TYPES.some((d) => d.value === raw)
      ? (raw as ListingSearchFilters["dealType"])
      : "sale"; // buyers are the default audience
  }

  // Only honour a town we actually have inventory in. Doubles as an
  // allow-list, so an arbitrary ?city= value can't be reflected into the page.
  const rawCity = first(params.city);
  const city = rawCity && cities.includes(rawCity) ? rawCity : undefined;

  return {
    dealType,
    city,
    minBeds: toPositiveInt(params.minBeds),
    minBaths: toPositiveInt(params.minBaths),
    minPrice: toPositiveInt(params.minPrice),
    maxPrice: toPositiveInt(params.maxPrice),
  };
}

/*
  Rebuild the querystring for a pagination link. `includeDealType` is false
  on the routes where it's implied, keeping those URLs clean.
*/
export function buildHref(
  basePath: string,
  filters: ListingSearchFilters,
  page: number,
  includeDealType = true,
): string {
  const query = new URLSearchParams();
  if (includeDealType && filters.dealType) query.set("dealType", filters.dealType);
  if (filters.city) query.set("city", filters.city);
  if (filters.minBeds !== undefined) query.set("minBeds", String(filters.minBeds));
  if (filters.minBaths !== undefined) query.set("minBaths", String(filters.minBaths));
  if (filters.minPrice !== undefined) query.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) query.set("maxPrice", String(filters.maxPrice));
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
