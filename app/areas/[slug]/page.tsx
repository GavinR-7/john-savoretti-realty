/*
  DYNAMIC AREA PAGES — app/areas/[slug]/page.tsx
  One file → eleven pages (/areas/franklin-square, /areas/garden-city, …).

  The [slug] folder name is the magic: Next.js treats it as a URL parameter.
  generateStaticParams() tells Next every slug at build time, so all eleven
  pages pre-render as static HTML — instant loads + ideal for the local SEO
  these town pages exist for ("homes for sale in Merrick NY" searches).

  Next.js 15 quirk worth remembering: `params` is now a Promise, so the
  page is an async function that awaits it. Older tutorials show it as a
  plain object — that's the #1 upgrade error you'll see in the wild.
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { areas } from "@/data/areas";
import { listings } from "@/data/listings";
import { business } from "@/data/site";
import ListingCard from "@/components/ListingCard";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `Homes for sale in ${area.name}, NY`,
    description: `${area.blurb} Talk to a local John Savoretti Realty agent about buying or selling in ${area.name}.`,
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const localListings = listings.filter((l) => l.areaSlug === slug);

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
              Homes in {area.name}
            </h1>
            <span className="rounded-full border border-brass-light/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brass-light">
              {area.county} County
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            {area.blurb}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={business.phoneNassauHref}
              className="inline-flex items-center justify-center rounded-lg bg-brass-light px-5 py-3 text-sm font-semibold text-harbor transition hover:bg-white"
            >
              Call about {area.name} — {business.phoneNassau}
            </a>
            <a
              href="/#home-value"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              What&rsquo;s my {area.name} home worth?
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
                Current exclusives in {area.name}
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
                Nothing public in {area.name} right now
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
            Own a home in {area.name}?
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
