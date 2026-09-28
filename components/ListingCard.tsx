/*
  One property card. Pure presentation, no state — it just receives a
  `Listing` object and renders it, so the homepage grid, the area pages,
  and the search pages all reuse the exact same card.

  MOBILE DENSITY: the card is deliberately tighter below `sm` so two fit on a
  phone screen at once (a 3:2 image instead of 4:3, half the padding, smaller
  type, two-line description, MLS # hidden) — roughly Zillow's density. Every
  override is a bare utility with an `sm:` counterpart restoring the original
  desktop card, so nothing changes from the small breakpoint up.
*/

import Link from "next/link";
import PropertyImage from "@/components/PropertyImage";
import { formatPrice, type Listing } from "@/data/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  const isPending = listing.status === "Pending";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-atlantic/10">
      <div className="relative aspect-[3/2] overflow-hidden sm:aspect-[4/3]">
        <PropertyImage
          src={listing.image}
          alt={`${listing.style ?? "Property"} in ${listing.city}, NY`}
        />
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] ${
            isPending ? "bg-brass-light text-harbor" : "bg-atlantic text-white"
          }`}
        >
          {listing.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-2 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/listings/${listing.mls}`}
            className="font-display text-lg font-semibold text-atlantic sm:text-2xl"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            <span className="sr-only">View listing: {listing.city} {listing.style}, </span>
            {formatPrice(listing.price, listing.dealType)}
          </Link>
          <p className="hidden text-xs font-medium uppercase tracking-wider text-mist sm:block">
            MLS #{listing.mls}
          </p>
        </div>

        <p className="text-xs font-medium text-ink sm:text-sm">
          {listing.beds !== undefined && <span>{listing.beds} bd · </span>}
          {listing.baths !== undefined && <span>{listing.baths} ba · </span>}
          <span>{listing.style}</span>
        </p>

        <p className="line-clamp-2 text-xs leading-snug text-mist sm:line-clamp-3 sm:text-sm sm:leading-relaxed">
          {listing.description}
        </p>

        {/* No City on the row means no area page exists — show the town as
            plain text rather than linking somewhere that 404s. */}
        {/* IDX attribution — the listing brokerage must be credited. */}
        {listing.listOfficeName && (
          <p className="text-[10px] leading-tight text-mist/80 sm:text-xs">
            Listing courtesy of {listing.listOfficeName}
          </p>
        )}

        {listing.areaSlug ? (
          <Link
            href={`/areas/${listing.areaSlug}`}
            className="relative z-10 mt-auto pt-1 text-xs font-semibold text-channel transition-colors hover:text-atlantic sm:pt-2 sm:text-sm"
          >
            {listing.city}, NY — see the area{" "}
            <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        ) : (
          <p className="mt-auto pt-1 text-xs font-semibold text-mist sm:pt-2 sm:text-sm">
            {listing.city}, NY
          </p>
        )}

      </div>
    </article>
  );
}