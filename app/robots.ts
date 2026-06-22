/*
  ROBOTS — served at /robots.txt. Allows all crawlers and points them at
  the sitemap.
*/
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://johnsavorettirealty.com/sitemap.xml",
  };
}
