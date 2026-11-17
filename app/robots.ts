import type { MetadataRoute } from "next";
import { IS_PUBLIC_LAUNCH, SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return IS_PUBLIC_LAUNCH
    ? { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
