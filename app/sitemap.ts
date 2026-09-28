/*
  SITEMAP — Next serves this at /sitemap.xml.

  Reads from the database so it covers real inventory: every listing detail
  page, and every area page including the DB-derived towns that aren't in the
  curated data/areas.ts list.

  ⚠️ TODO: point BASE at the real domain at launch (or set NEXT_PUBLIC_SITE_URL).
*/
import type { MetadataRoute } from "next";

import { areas } from "@/data/areas";
import { agents } from "@/data/agents";
import {
  getAllListingMlsNumbers,
  getCitiesWithListings,
  getLastSyncedAt,
  toAreaSlug,
} from "@/lib/db/listings";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://johnsavorettirealty.com")
  .replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [mlsNumbers, cities, lastSynced] = await Promise.all([
    getAllListingMlsNumbers(),
    getCitiesWithListings(),
    getLastSyncedAt(),
  ]);

  // Feed-backed pages change whenever the feed does, so they share the
  // sync timestamp rather than claiming to be fresh on every request.
  const feedUpdated = lastSynced ?? new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/buy`, lastModified: feedUpdated, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/rentals`, lastModified: feedUpdated, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/commercial`, lastModified: feedUpdated, changeFrequency: "hourly", priority: 0.7 },
    { url: `${BASE}/agents`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const agentPages: MetadataRoute.Sitemap = agents.map((agent) => ({
    url: `${BASE}/agents/${agent.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  /*
    Curated slugs union'd with slugs derived from real DB cities — the same
    set app/areas/[slug]/page.tsx generates, so the sitemap can't advertise a
    town that 404s or omit one that exists.
  */
  const areaSlugs = Array.from(
    new Set([
      ...areas.map((a) => a.slug),
      ...cities.map((city) => toAreaSlug(city)).filter((s): s is string => Boolean(s)),
    ]),
  );

  const areaPages: MetadataRoute.Sitemap = areaSlugs.map((slug) => ({
    url: `${BASE}/areas/${slug}`,
    lastModified: feedUpdated,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const listingPages: MetadataRoute.Sitemap = mlsNumbers.map((mls) => ({
    url: `${BASE}/listings/${mls}`,
    lastModified: feedUpdated,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticPages, ...agentPages, ...areaPages, ...listingPages];
}
