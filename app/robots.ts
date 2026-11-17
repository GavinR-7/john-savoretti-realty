/*
  ROBOTS — served at /robots.txt. Allows all crawlers, keeps them out of the
  API routes (lead form, cron sync), and points them at the sitemap. The host
  comes from NEXT_PUBLIC_SITE_URL, the same value the sitemap and metadata use.
*/
import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://johnsavorettirealty.com")
  .replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
