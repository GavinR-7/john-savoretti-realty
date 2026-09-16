/*
  COMMERCIAL — app/commercial/page.tsx
  Same search experience as /buy, pre-scoped to commercial by the route.
*/
import type { Metadata } from "next";

import ListingResults from "@/components/ListingResults";
import { parseFilters, type SearchParams } from "@/lib/listing-search";
import { getCitiesWithListings } from "@/lib/db/listings";

export const metadata: Metadata = {
  title: "Long Island Commercial Property",
  description:
    "Commercial property for sale and lease across Nassau, Suffolk, and Queens. Filter by town, price, and size with John Savoretti Realty.",
};

type Props = { searchParams: Promise<SearchParams> };

export default async function CommercialPage({ searchParams }: Props) {
  const params = await searchParams;
  const cities = await getCitiesWithListings();
  const filters = parseFilters(params, cities, "commercial");

  return (
    <ListingResults
      basePath="/commercial"
      title="Commercial"
      intro="Commercial property across Long Island and Queens — storefronts, offices, and mixed-use. Tell us what you need and we'll find it."
      emptyTitle="No commercial listings match those filters"
      params={params}
      cities={cities}
      filters={filters}
    />
  );
}
