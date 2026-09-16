/*
  RENTALS — app/rentals/page.tsx
  The same search experience as /buy, pre-scoped to rentals by the route.
  Deal type is fixed here, so it isn't offered as a control and isn't carried
  in pagination links.
*/
import type { Metadata } from "next";

import ListingResults from "@/components/ListingResults";
import { parseFilters, type SearchParams } from "@/lib/listing-search";
import { getCitiesWithListings } from "@/lib/db/listings";

export const metadata: Metadata = {
  title: "Long Island Rentals",
  description:
    "Homes and apartments for rent across Nassau, Suffolk, and Queens. Filter by town, price, bedrooms, and bathrooms with John Savoretti Realty.",
};

type Props = { searchParams: Promise<SearchParams> };

export default async function RentalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const cities = await getCitiesWithListings();
  const filters = parseFilters(params, cities, "rent");

  return (
    <ListingResults
      basePath="/rentals"
      title="Rentals"
      intro="Apartments and homes for rent across Long Island and Queens. New listings come and go quickly — call us before they're gone."
      emptyTitle="No rentals match those filters"
      params={params}
      cities={cities}
      filters={filters}
    />
  );
}
