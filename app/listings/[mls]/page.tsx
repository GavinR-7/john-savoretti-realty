/*
  INDIVIDUAL LISTING PAGE — app/listings/[mls]/page.tsx
  One file → one page per listing, keyed by MLS number.
  /listings/7293787, /listings/3323307, etc.

  Keyed on `mls` (not a hand-made slug) because when the IDX feed lands,
  every record already carries its MLS number. Zero hand-work at migration.
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { formatPrice } from "@/data/listings";
import { findAgentByMlsId, toTelHref } from "@/data/agents";
import { business } from "@/data/site";
import ListingCard from "@/components/ListingCard";
import ListingGallery from "@/components/ListingGallery";
import { getListingByMls, getAllListingMlsNumbers, getListingsByCity } from "@/lib/db/listings";


type Props = { params: Promise<{ mls: string }> };

export async function generateStaticParams() {
  const mlsNumbers = await getAllListingMlsNumbers();
  return mlsNumbers.map((mls) => ({ mls }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mls } = await params;
  const listing = await getListingByMls(mls);
  if (!listing) return {};

  const headline = listing.address
    ? `${listing.address}, ${listing.city}, NY`
    : `${listing.style ?? "Home"} in ${listing.city}, NY`;

  return {
    title: headline,
    // Metadata descriptions get truncated by Google around 155 chars.
    description: listing.description?.slice(0, 155),
  };
}

export default async function ListingPage({ params }: Props) {
  const { mls } = await params;

  const listing = await getListingByMls(mls);
  // GUARD: .find() returns undefined when nothing matches (bad URL).
  // notFound() renders the 404 page AND tells TypeScript everything below
  // this line has a real listing — no more "possibly undefined" errors.
  if (!listing) notFound();

  /*
    ⚠️ IDX ATTRIBUTION: the listing agent and office come straight off the
    feed and are ALWAYS displayed — most listings belong to other brokerages
    and crediting them is a condition of using the feed.

    Separately, if this listing happens to be one of OUR agents' (matched on
    the MLS ID), we additionally link the name through to their bio page.
    Returns undefined for every other brokerage, which is the common case.
  */
  const agent = findAgentByMlsId(listing.listAgentMlsId);

  /*
    THE PATTERN WORTH LEARNING — a details ARRAY instead of ten
    conditional blocks.

    The naive version is ten copies of {listing.x && <p>...</p>}, which is
    repetitive and a pain to reorder or restyle. Instead: describe the rows
    as data, drop the empty ones, then map them. Adding a field later is
    one line here — not a new block of JSX.
  */
  const details = [
    { label: "Bedrooms", value: listing.beds },
    { label: "Bathrooms", value: listing.baths },
    { label: "Property type", value: listing.style },
    { label: "Square feet", value: listing.squareFeet?.toLocaleString() },
    { label: "Rooms", value: listing.rooms },
    { label: "Lot size", value: listing.lotSize ? `${listing.lotSize} acres` : undefined },
    { label: "Families", value: listing.numberOfFamilies },
    { label: "Year built", value: listing.yearBuilt },
    { label: "School district", value: listing.schoolDistrict },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== "");

  const financials = [
    { label: "Price", value: formatPrice(listing.price, listing.dealType) },
    { label: "Annual taxes", value: listing.taxes ? `$${listing.taxes.toLocaleString()}` : undefined },
  ].filter((row) => row.value !== undefined);

  const moreInArea = (await getListingsByCity(listing.city, 4))
    .filter((l) => l.mls !== listing.mls)
    .slice(0, 3);

  const twoColumnDetails = details.length >= 5;

  return (
    <>
      {/* Breadcrumb bar — orientation + a way back out */}
      <div className="border-b border-atlantic/10 bg-fog">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 text-sm sm:px-6">
          <Link href="/buy" className="font-medium text-atlantic hover:text-channel">
            All listings
          </Link>
          <span className="text-mist">/</span>
          {/* No City on the row means no area page — plain text, not a 404 link. */}
          {listing.areaSlug ? (
            <Link href={`/areas/${listing.areaSlug}`} className="font-medium text-atlantic hover:text-channel">
              {listing.city}
            </Link>
          ) : (
            <span className="font-medium text-mist">{listing.city}</span>
          )}
          <span className="text-mist">/</span>
          <span className="text-mist">MLS #{listing.mls}</span>
        </div>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="grid gap-10 lg:grid-cols-12">

            {/* ---------- LEFT: imagery ---------- */}
            <div className="lg:col-span-7">
              <ListingGallery
                images={[listing.image, ...(listing.gallery ?? [])]}
                alt={`${listing.style ?? "Home"} in ${listing.city}, NY`}
                status={listing.status}
              />
            </div>

            {/* ---------- RIGHT: the facts ---------- */}
            <div className="lg:col-span-5">
              <h1 className="font-display text-3xl font-semibold leading-tight text-harbor sm:text-4xl">
                {listing.address ?? `${listing.style ?? "Home"} in ${listing.city}`}
              </h1>
              <p className="mt-2 text-mist">
                {listing.city}
                {listing.state && `, ${listing.state}`}
                {listing.zip && ` ${listing.zip}`}
              </p>

              <p className="mt-6 font-display text-4xl font-semibold text-atlantic">
                {formatPrice(listing.price, listing.dealType)}
              </p>

              {/* At-a-glance strip. Each item only appears if it has a value. */}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-atlantic/10 py-4 text-sm font-medium text-ink">
                {listing.beds !== undefined && <span>{listing.beds} bd</span>}
                {listing.baths !== undefined && <span>{listing.baths} ba</span>}
                {listing.squareFeet !== undefined && <span>{listing.squareFeet.toLocaleString()} sq ft</span>}
                {listing.style && <span>{listing.style}</span>}
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
                    About this home
                  </h2>
                  <p className="mt-3 leading-relaxed text-mist">{listing.description}</p>
                </div>
              )}

              {/* Details — rendered from the array we built above. */}
              {details.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
                    Details
                  </h2>
                  <dl
                    className={`mt-3 grid gap-x-6 gap-y-2 text-sm ${
                      twoColumnDetails ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {details.map((row) => (
                      <div key={row.label} className="flex justify-between gap-3 border-b border-atlantic/10 py-1.5">
                        <dt className="text-mist">{row.label}</dt>
                        <dd className="font-medium text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
                  Financials
                </h2>
                <dl className="mt-3 grid gap-y-2 text-sm">
                  {financials.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 border-b border-atlantic/10 py-1.5">
                      <dt className="text-mist">{row.label}</dt>
                      <dd className="font-medium text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* ⚠️ IDX ATTRIBUTION — always shown when the feed provides it.
                  The name links to a bio only when it's one of our agents. */}
              {(listing.listAgentFullName || listing.listOfficeName) && (
                <div className="mt-8 rounded-2xl border border-atlantic/10 bg-fog p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
                    Listed by
                  </p>

                  {listing.listAgentFullName && (
                    <p className="mt-2 font-display text-lg font-semibold text-harbor">
                      {agent ? (
                        <Link href={`/agents/${agent.slug}`} className="text-atlantic hover:text-channel">
                          {listing.listAgentFullName}
                        </Link>
                      ) : (
                        listing.listAgentFullName
                      )}
                    </p>
                  )}

                  {listing.listOfficeName && (
                    <p className="text-sm text-mist">{listing.listOfficeName}</p>
                  )}

                  {/* Our own agents get their roster contact details too. */}
                  {agent && (
                    <>
                      <p className="mt-3 text-sm text-ink">
                        Office:{" "}
                        <a
                          href={toTelHref(agent.officePhone) ?? undefined}
                          className="font-medium text-atlantic hover:text-channel"
                        >
                          {agent.officePhone}
                        </a>
                      </p>
                      {agent.cell && (
                        <p className="text-sm text-ink">
                          Direct:{" "}
                          <a
                            href={toTelHref(agent.cell) ?? undefined}
                            className="font-medium text-atlantic hover:text-channel"
                          >
                            {agent.cell}
                          </a>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={business.phoneNassauHref}
                  className="inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
                >
                  Call about this home
                </a>
                <Link
                  href="/#contact"
                  className="inline-flex items-center justify-center rounded-lg border border-atlantic/20 px-5 py-3 text-sm font-semibold text-atlantic transition hover:border-atlantic/50"
                >
                  Request a showing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {moreInArea.length > 0 && (
        <section className="bg-fog">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-harbor">
                More homes in {listing.city}
              </h2>
              {listing.areaSlug && (
                <Link
                  href={`/areas/${listing.areaSlug}`}
                  className="text-sm font-semibold text-atlantic hover:text-channel"
                >
                  See all homes in {listing.city} →
                </Link>
              )}
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreInArea.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}