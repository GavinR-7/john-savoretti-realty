/*
  The results body shared by /buy, /rentals, and /commercial: hero band,
  filter bar, count line, grid, pagination, empty state.

  The three pages differ only in their copy, their base path, and whether the
  visitor picks the deal type or the route fixes it — so all of that is props
  and the behaviour lives here once.
*/
import Link from "next/link";

import { business } from "@/data/site";
import ListingCard from "@/components/ListingCard";
import ListingFilters from "@/components/ListingFilters";
import Pagination from "@/components/Pagination";
import { buildHref, toPositiveInt, type SearchParams } from "@/lib/listing-search";
import {
  searchListings,
  countListings,
  LISTINGS_PER_PAGE,
  type ListingSearchFilters,
} from "@/lib/db/listings";

type Props = {
  basePath: string;
  title: string;
  intro: string;
  emptyTitle: string;
  params: SearchParams;
  cities: string[];
  filters: ListingSearchFilters;
  includeDealTypeInLinks?: boolean;
  dealTypeControl?: React.ReactNode;
};

export default async function ListingResults({
  basePath, title, intro, emptyTitle,
  params, cities, filters,
  includeDealTypeInLinks = false,
  dealTypeControl,
}: Props) {
  /*
    The count runs first because it decides how many pages exist, which is
    what lets us clamp an out-of-range ?page=999 to the last real page.
    Without the clamp the offset runs past the end of the result set and the
    "showing X–Y of Z" line reports a nonsense range over an empty grid.
  */
  const total = await countListings(filters);
  const totalPages = Math.max(Math.ceil(total / LISTINGS_PER_PAGE), 1);
  const page = Math.min(Math.max(toPositiveInt(params.page) ?? 1, 1), totalPages);
  const listings = await searchListings(filters, page);

  const firstOnPage = total === 0 ? 0 : (page - 1) * LISTINGS_PER_PAGE + 1;
  const lastOnPage = Math.min(page * LISTINGS_PER_PAGE, total);

  return (
    <>
      <section className="bg-atlantic text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">{intro}</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <ListingFilters
            action={basePath}
            cities={cities}
            filters={filters}
            extraControl={dealTypeControl}
          />

          <p className="mt-4 text-sm text-mist" aria-live="polite">
            {total > 0
              ? `Showing ${firstOnPage}–${lastOnPage} of ${total} ${total === 1 ? "listing" : "listings"}`
              : "No listings match those filters"}
          </p>

          {listings.length > 0 ? (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                hrefForPage={(p) => buildHref(basePath, filters, p, includeDealTypeInLinks)}
              />
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-atlantic/10 bg-fog p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-semibold text-harbor">{emptyTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-mist">
                Try widening the price range or clearing a filter. Our agents see
                every home on the MLS the moment it lists, so tell us what
                you&rsquo;re after and we&rsquo;ll find it.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={business.phoneNassauHref}
                  className="inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
                >
                  Call {business.phoneNassau}
                </a>
                <Link
                  href={basePath}
                  className="inline-flex items-center justify-center rounded-lg border border-atlantic/20 px-5 py-3 text-sm font-semibold text-atlantic transition hover:border-atlantic/50"
                >
                  Clear filters
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
