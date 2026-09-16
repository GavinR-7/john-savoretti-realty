/*
  DYNAMIC AREA PAGES — app/areas/[slug]/page.tsx
  One file → a page per town: the curated towns in data/areas.ts (full
  copy — blurb, county chip) plus every other city that has listings in
  the database (simpler layout — just the name, listings, and CTAs).

  The [slug] folder name is the magic: Next.js treats it as a URL parameter.
  generateStaticParams() tells Next every slug at build time — curated
  slugs union'd with slugs derived from real DB city values — so all of
  them pre-render as static HTML, ideal for the local SEO these town
  pages exist for ("homes for sale in Merrick NY" searches).

  Next.js 15 quirk worth remembering: `params` is now a Promise, so the
  page is an async function that awaits it. Older tutorials show it as a
  plain object — that's the #1 upgrade error you'll see in the wild.
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { areas, type Area } from "@/data/areas";
import { business } from "@/data/site";
import ListingCard from "@/components/ListingCard";
import { getListingsByCity, getCitiesWithListings, toAreaSlug } from "@/lib/db/listings";

type Props = { params: Promise<{ slug: string }> };

// A curated area (in data/areas.ts) resolves with county + blurb; a city
// that only exists because it has listings resolves with just a name.
type Place = { name: string; county?: Area["county"]; blurb?: string };

async function resolvePlace(slug: string): Promise<Place | null> {
  const area = areas.find((a) => a.slug === slug);
  if (area) return { name: area.name, county: area.county, blurb: area.blurb };

  const cities = await getCitiesWithListings();
  const city = cities.find((c) => toAreaSlug(c) === slug);
  return city ? { name: city } : null;
}

export async function generateStaticParams() {
  const curatedSlugs = areas.map((area) => area.slug);
  const cities = await getCitiesWithListings();
  const citySlugs = cities.map((city) => toAreaSlug(city));
  const slugs = Array.from(new Set([...curatedSlugs, ...citySlugs]));
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await resolvePlace(slug);
  if (!place) return {};
  return {
    title: `Homes for sale in ${place.name}, NY`,
    description: place.blurb
      ? `${place.blurb} Talk to a local John Savoretti Realty agent about buying or selling in ${place.name}.`
      : `Browse current listings in ${place.name}, NY with John Savoretti Realty.`,
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const place = await resolvePlace(slug);
  if (!place) notFound();

  const localListings = await getListingsByCity(place.name);

  return (
    <>
      {/* Hero band */}
      <section className="bg-atlantic text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <a
            href="/#areas"
            className="text-sm font-medium text-brass-light hover:text-white"
          >
            ← All areas
          </a>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">
              Homes in {place.name}
            </h1>
            {place.county && (
              <span className="rounded-full border border-brass-light/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brass-light">
                {place.county} County
              </span>
            )}
          </div>
          {place.blurb && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
              {place.blurb}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={business.phoneNassauHref}
              className="inline-flex items-center justify-center rounded-lg bg-brass-light px-5 py-3 text-sm font-semibold text-harbor transition hover:bg-white"
            >
              Call about {place.name} — {business.phoneNassau}
            </a>
            <a
              href="/#home-value"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              What&rsquo;s my {place.name} home worth?
            </a>
          </div>
        </div>
      </section>

      {/* Listings in this area */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          {localListings.length > 0 ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-harbor">
                Current exclusives in {place.name}
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {localListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-atlantic/10 bg-fog p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-semibold text-harbor">
                Nothing public in {place.name} right now
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-mist">
                Inventory moves fast here — some homes sell before they ever
                hit the portals. Call the office and we&rsquo;ll tell you
                what&rsquo;s coming before it lists.
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

      {/* Seller CTA band */}
      <section className="bg-fog">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-harbor sm:text-3xl">
            Own a home in {place.name}?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mist">
            Find out what it would sell for in today&rsquo;s market — a real
            number from a local broker, not an algorithm.
          </p>
          <a
            href="/#home-value"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-atlantic px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-channel"
          >
            Get my home&rsquo;s value
          </a>
        </div>
      </section>
    </>
  );
}
