/*
  LISTING SHAPE + PRICE FORMATTING.

  The hardcoded demo array that used to live here is gone — every page now
  reads real inventory from Postgres via lib/db/listings.ts. What remains is
  the contract the UI is written against: the `Listing` type that the database
  mapper produces, and the price formatter the cards and detail page share.
*/

export type Listing = {
  // always present
  id: string;
  mls: string; // listing # from the current site — verify before publishing
  address?: string;
  city: string;
  state?: string;
  county?: string;
  image: string; // PLACEHOLDER — replace with real photos (see README)
  // Optional: a feed row with no City has no area page to link to.
  areaSlug?: string;
  price: number;
  // might be missing
  taxes?: number;
  zip?: number;
  lotSize?: number;
  squareFeet?: number;
  yearBuilt?: number;
  numberOfFamilies?: number;
  rooms?: number;
  schoolDistrict?: string;
  gallery?: string[];
  agentSlug?: string;
  beds?: number;
  baths?: number;
  style?: string;
  status?: "For sale" |"For rent" | "Pending" | "Coming soon";
  dealType: "sale" | "rent" | "commercial";
  description?: string; // PLACEHOLDER COPY — have John approve
  // IDX attribution — who actually listed the home. Comes straight from the
  // feed, so it's present on DB-backed listings and absent on these fixtures.
  listAgentFullName?: string;
  listAgentMlsId?: string;
  listOfficeName?: string;
};

export function formatPrice(price: number, dealType: string): string {
  const formatted = price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (dealType === "rent") {
    return formatted + "/mo";
  }
  return formatted;

}
