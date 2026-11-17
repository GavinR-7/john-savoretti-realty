import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { formPrivacy } from "@/content/formPrivacy";

export const metadata: Metadata = pageMetadata("/privacy", { title: "Privacy", description: "How John Savoretti Realty handles website inquiries." });

export default function FormPrivacyPage() {
  return <section className="mx-auto max-w-3xl px-6 py-24">
    <h1 className="mb-6 text-3xl">{formPrivacy.title}</h1>
    <p className="mb-4">{formPrivacy.delivery}</p>
    <p className="mb-4">{formPrivacy.security}</p>
    <a className="underline" href={formPrivacy.url}>{formPrivacy.link}</a>
    <p className="mt-4">{formPrivacy.logs}</p>
    <p className="mt-4">{formPrivacy.alternative}</p>
  </section>;
}
