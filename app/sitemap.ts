/*
  SITEMAP — Next auto-serves this at /sitemap.xml. It lists every URL so
  Google indexes the eleven town pages (the local-SEO engine of the site).
  TODO: swap BASE for the real domain at launch.
*/
import type { MetadataRoute } from "next";
import { areas } from "@/data/areas";

const BASE = "https://johnsavorettirealty.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), priority: 1 },
    ...areas.map((area) => ({
      url: `${BASE}/areas/${area.slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}
