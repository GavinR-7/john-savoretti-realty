/*
  The homepage storefront strip: John Savoretti Realty's OWN listings.

  This used to be an interactive filter over 15 pre-fetched rows, which meant
  filtering searched inside those 15 rather than the whole feed — a subset of
  a subset. Search now lives on /buy, backed by real SQL, so this is a pure
  showcase and no longer needs client state. No "use client": it renders on
  the server and ships as plain HTML.

  The other brokerages' inventory belongs on /buy; the homepage is his shop
  window. If his office has nothing in the feed yet, we fall back to recent
  in-market listings rather than showing an empty section.
*/
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { getOfficeListings, getAllListings } from "@/lib/db/listings";
import { business } from "@/data/site";

const SHOWCASE_LIMIT = 15;

export default async function FeaturedListings() {
  const officeListings = await getOfficeListings(SHOWCASE_LIMIT);
  const usingFallback = officeListings.length === 0;
  const listings = usingFallback
    ? await getAllListings(SHOWCASE_LIMIT)
    : officeListings;

  return (
    <section id="listings" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass-deep">
              {usingFallback ? "On the market" : "Our listings"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-atlantic sm:text-4xl">
              {usingFallback
                ? "Homes across Long Island"
                : "Featured homes from our office"}
            </h2>
            <p className="mt-3 text-mist">
              {usingFallback
                ? "A look at what's moving across Nassau, Suffolk, and Queens — and our agents can show you anything on the market, not just what's here."
                : "Exclusives listed by John Savoretti Realty — and our agents can show you anything on the market, not just what's here."}
            </p>
          </div>

          <Link
            href="/buy"
            className="rounded-md bg-atlantic px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-channel"
          >
            See all listings <span aria-hidden="true">→</span>
          </Link>
        </div>

        {listings.length > 0 ? (
          // The "See all listings" link in the header above is the single
          // route to /buy from this section.
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          // Only reachable if the feed itself is empty (nothing synced yet).
          <div className="mt-10 rounded-xl border border-dashed border-ink/20 bg-fog p-10 text-center">
            <p className="font-display text-xl font-semibold text-atlantic">
              Our listings are on their way.
            </p>
            <p className="mt-2 text-mist">
              Call the office and we&rsquo;ll tell you what&rsquo;s coming up
              before it hits the portals.
            </p>
            <a
              href={business.phoneNassauHref}
              className="mt-5 inline-block rounded-md bg-atlantic px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-channel"
            >
              Call {business.phoneNassau}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
