/*
  "Explore homes by area" — town tiles, each linking to its own /areas/[slug]
  landing page (the local-SEO play: a Google search for "homes for sale
  franklin square ny" can land directly on that page).

  The towns come from John's OWN inventory rather than a hardcoded list, so
  the section reflects where his agents actually list. data/areas.ts is still
  the source of the curated blurb and county — when a town has an entry there
  we use it; towns without one simply show their name. If his office has no
  listings in the feed yet, we fall back to the curated list so the section is
  never empty.
*/

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { areas } from "@/data/areas";
import { getOfficeCities, toAreaSlug } from "@/lib/db/listings";

type Tile = { slug: string; name: string; county?: string };

export default async function AreasGrid() {
  const officeCities = await getOfficeCities();

  const tiles: Tile[] = officeCities.length
    ? officeCities.flatMap((city) => {
        const slug = toAreaSlug(city);
        if (!slug) return []; // no city, no area page to link to
        const curated = areas.find((a) => a.slug === slug);
        return [{ slug, name: curated?.name ?? city, county: curated?.county }];
      })
    : areas.map((a) => ({ slug: a.slug, name: a.name, county: a.county }));

  return (
    <section id="areas" className="bg-fog">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass-deep">
              Areas we serve
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-atlantic sm:text-4xl">
              Explore homes by area
            </h2>
            <p className="mt-3 text-mist">
              Communities across Nassau, Suffolk, and Queens — each one a place
              our agents actually live, list, and sell.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tiles.map((area, i) => (
            <Reveal key={area.slug} delay={Math.min(i * 60, 360)}>
              <Link
                href={`/areas/${area.slug}`}
                className="group relative block overflow-hidden rounded-xl border border-ink/10 bg-white p-5 transition-colors hover:border-atlantic hover:bg-atlantic"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-5 select-none font-display text-7xl font-semibold text-fog transition-colors group-hover:text-white/10"
                >
                  {area.name[0]}
                </span>
                <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-deep transition-colors group-hover:text-brass-light">
                  {area.county ?? "\u00A0"}
                </p>
                <p className="relative mt-2 font-display text-lg font-semibold leading-snug text-atlantic transition-colors group-hover:text-white">
                  {area.name}
                </p>
                <p className="relative mt-3 text-sm font-medium text-channel opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-brass-light">
                  View homes <span aria-hidden="true">→</span>
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
