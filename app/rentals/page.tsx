// app/rentals/page.tsx
// A STATIC route: the folder "rentals" → the URL "/rentals".
// No [slug], no params, no generateStaticParams — simpler than the areas page.

import type { Metadata } from "next";
import { listings } from "@/data/listings";
import { business } from "@/data/site";
import ListingCard from "@/components/ListingCard";

// Page-level SEO for this specific page.
export const metadata: Metadata = {
  title: "Long Island Rentals",
  description:
    "Homes and apartments for rent across Nassau, Suffolk, and Queens with John Savoretti Realty.",
};

export default function RentalsPage() {
  // The one line that makes this the "rentals" page: filter the master
  // list down to only rentals. Same idea as the areas page filtering by
  // areaSlug — here we filter by dealType.
  const rentals = listings.filter((l) => l.dealType === "rent");

  return (
    <>
      {/* Hero band — copied from the areas page, text changed */}
      <section className="bg-atlantic text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            Rentals
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            Apartments and homes for rent across Long Island and Queens. New
            listings come and go quickly — call us before they&rsquo;re gone.
          </p>
        </div>
      </section>

      {/* The listings grid */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          {rentals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rentals.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            // Empty state — copied from the areas page pattern
            <div className="rounded-2xl border border-atlantic/10 bg-fog p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-semibold text-harbor">
                No rentals available right now
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-mist">
                Our rentals move fast. Call the office and we&rsquo;ll let you
                know what&rsquo;s coming up.
              </p>
                <a
                href={business.phoneNassauHref}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
              >
                Call {business.phoneNassau}
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}