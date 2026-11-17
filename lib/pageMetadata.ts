import type { Metadata } from "next";
import { business } from "@/data/site";

/*
  Metadata for a sub-page.

  Next replaces `openGraph` wholesale when a page sets it, so a page that only
  sets title/description loses the site name, type and share image the root
  layout provides. Spelling them out here keeps every page's link preview
  complete and gives every page its own canonical URL (relative to
  metadataBase in app/layout.tsx).

  The share image is the client's crest in /public/logo.png until a designed
  1200x630 card exists (see the launch checklist). `image` lets a listing page
  use its own photo instead.
*/
export function pageMetadata(
  path: string,
  seo: { title: string; description?: string; image?: string },
): Metadata {
  const imageUrl = seo.image ?? "/logo.png";
  const images = [{ url: imageUrl, alt: business.name }];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: path },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: path,
      siteName: business.name,
      locale: "en_US",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [imageUrl],
    },
  };
}
