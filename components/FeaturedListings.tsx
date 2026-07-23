"use client";

/*
  The "property search" section: a filter bar + the listings grid.

  This is a client component because the filters are interactive state.
  The pattern to notice: the UI is a pure function of (data + filter state).
  We never touch the DOM by hand — change the state, React re-renders the
  grid. `useMemo` recomputes the filtered list only when an input changes.

  When a live MLS/IDX feed arrives, only the data source changes; this
  filtering UI keeps working as-is.
*/

import { useMemo, useState } from "react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { listings, saleListings } from "@/data/listings";


const PRICE_CAPS = [
  { label: "Any price", value: 0 },
  { label: "Up to $750K", value: 750_000 },
  { label: "Up to $1M", value: 1_000_000 },
  { label: "Up to $1.5M", value: 1_500_000 },
  { label: "Up to $2M", value: 2_000_000 },
];

export default function FeaturedListings() {
  const [city, setcity] = useState("all");
  const [minBeds, setMinBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  // Build the city dropdown from whatever citys exist in the data.
  const citys = useMemo(
    () => Array.from(new Set(saleListings.map((l) => l.city))).sort(),
    []
  );

  const filtered = useMemo(
    () =>
      saleListings.filter(
        (l) =>
          (city === "all" || l.city === city) &&
          (l.beds === undefined || l.beds >= minBeds) &&
          (maxPrice === 0 || l.price <= maxPrice)
      ),
    [city, minBeds, maxPrice]
  );

  const selectClasses =
    "w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-channel";

  return (
    <section id="listings" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass-deep">
            Exclusive listings
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-atlantic sm:text-4xl">
            Featured homes across Long Island
          </h2>
          <p className="mt-3 text-mist">
            Straight from our current exclusives — and our agents can show you anything
            on the market, not just what&rsquo;s here.
          </p>
        </div>

        {/* Filter bar — the "search" */}
        <form
          aria-label="Filter listings"
          className="mt-8 grid gap-3 rounded-xl bg-fog p-4 sm:grid-cols-3 lg:max-w-3xl"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-mist">
              city
            </span>
            <select className={selectClasses} value={city} onChange={(e) => setcity(e.target.value)}>
              <option value="all">All citys</option>
              {citys.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-mist">
              Bedrooms
            </span>
            <select
              className={selectClasses}
              value={minBeds}
              onChange={(e) => setMinBeds(Number(e.target.value))}
            >
              <option value={0}>Any beds</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5+</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-mist">
              Max price
            </span>
            <select
              className={selectClasses}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            >
              {PRICE_CAPS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </form>

        <p className="mt-4 text-sm text-mist" aria-live="polite">
          Showing {filtered.length} of {saleListings.length} exclusives
        </p>

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-ink/20 bg-fog p-10 text-center">
            <p className="font-display text-xl font-semibold text-atlantic">
              Nothing here matches those filters — yet.
            </p>
            <p className="mt-2 text-mist">
              Our agents see every home on the MLS the moment it lists. Tell us what
              you&rsquo;re looking for and we&rsquo;ll find it.
            </p>
            <Link
              href="/#contact"
              className="mt-5 inline-block rounded-md bg-atlantic px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-channel"
            >
              Tell us what you want
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
