/*
  One property card. Pure presentation, no state — it just receives a
  `Listing` object and renders it, so the homepage grid, the area pages,
  and (later) a live MLS feed all reuse the exact same card.
*/

import Link from "next/link";
import PropertyImage from "@/components/PropertyImage";
import { formatPrice, type Listing } from "@/data/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  const isPending = listing.status === "Pending";

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-atlantic/10">
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyImage
          src={listing.image}
          alt={`${listing.style} home for sale in ${listing.town}, NY`}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
            isPending ? "bg-brass-light text-harbor" : "bg-atlantic text-white"
          }`}
        >
          {listing.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-atlantic">
            {formatPrice(listing.price)}
          </p>
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            MLS #{listing.mls}
          </p>
        </div>

        <p className="text-sm font-medium text-ink">
          {listing.beds} bd · {listing.baths} ba · {listing.style}
        </p>

        <p className="text-sm leading-relaxed text-mist">{listing.blurb}</p>

        <Link
          href={`/areas/${listing.areaSlug}`}
          className="mt-auto pt-2 text-sm font-semibold text-channel transition-colors hover:text-atlantic"
        >
          {listing.town}, NY — see the area{" "}
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
