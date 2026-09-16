/*
  PROPERTY SEARCH — app/buy/page.tsx
  The main browsing experience: the whole in-market feed, filtered and paged.

  A server component with no client state. Filter state lives entirely in the
  URL, which is what makes a result set shareable, bookmarkable, and able to
  survive a refresh. The filter bar and pager are shared with /rentals and
  /commercial; only the deal-type selector is unique to this page.

  The round trip: GET form → searchParams → parseFilters() → SQL WHERE. The
  database does the filtering, so we only ever fetch one page of rows.
*/
import type { Metadata } from "next";

import ListingResults from "@/components/ListingResults";
import { LABEL_CLASSES, SELECT_CLASSES } from "@/components/ListingFilters";
import { DEAL_TYPES, parseFilters, type SearchParams } from "@/lib/listing-search";
import { getCitiesWithListings } from "@/lib/db/listings";

export const metadata: Metadata = {
  title: "Search Long Island Homes for Sale",
  description:
    "Browse every home for sale, rent, and commercial listing across Nassau, Suffolk, and Queens. Filter by town, price, bedrooms, and bathrooms with John Savoretti Realty.",
};

type Props = { searchParams: Promise<SearchParams> };

export default async function BuyPage({ searchParams }: Props) {
  const params = await searchParams;
  const cities = await getCitiesWithListings();
  const filters = parseFilters(params, cities);

  return (
    <ListingResults
      basePath="/buy"
      title="Search homes"
      intro="Every listing we can show you across Nassau, Suffolk, and Queens. Narrow it down below — or call us and we'll do it for you."
      emptyTitle="Nothing matches those filters — yet"
      params={params}
      cities={cities}
      filters={filters}
      includeDealTypeInLinks
      dealTypeControl={
        <label className="block">
          <span className={LABEL_CLASSES}>Looking to</span>
          <select name="dealType" className={SELECT_CLASSES} defaultValue={filters.dealType}>
            {DEAL_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
      }
    />
  );
}
