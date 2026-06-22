/*
  ROOT LAYOUT — wraps every page in the app. This is where:
  - Fonts load via next/font (self-hosted by Next at build time: no request
    to Google at runtime, no flash of unstyled text). Each font exposes a
    CSS variable that globals.css maps into Tailwind's font-display/font-sans.
  - Site-wide SEO metadata lives (title template, description, OpenGraph).
  - JSON-LD structured data tells Google this is a RealEstateAgent with two
    offices — that's what powers rich results in local search. Note: we do
    NOT fabricate an aggregateRating here; Google penalizes unverifiable
    review markup. Add it only when real review data is wired in.
  - Global chrome mounts: Header, Footer, MobileCallBar, and the
    accessibility skip link.
*/

import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileCallBar from "@/components/MobileCallBar";
import { business } from "@/data/site";
import { areas } from "@/data/areas";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // TODO: swap for the real domain once purchased (e.g. johnsavorettirealty.com)
  metadataBase: new URL("https://johnsavorettirealty.com"),
  title: {
    default:
      "John Savoretti Realty — Long Island Homes | Nassau & Suffolk Real Estate",
    template: "%s | John Savoretti Realty",
  },
  description:
    "Family-run Long Island brokerage since 2001. 30+ agents, $47M+ sold in the last 12 months, offices in Franklin Square and Smithtown. Find out what your home is worth — no pressure.",
  openGraph: {
    title: "John Savoretti Realty — Long Island Homes",
    description:
      "Family-run Long Island brokerage since 2001. Find out what your home is worth — no pressure.",
    type: "website",
    locale: "en_US",
  },
};

// Structured data for local SEO. Rendered as a <script type="application/ld+json">.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: business.name,
  telephone: "+1-516-327-6400",
  email: business.email,
  foundingDate: "2001",
  sameAs: [business.instagram, business.facebook],
  areaServed: areas.map((a) => a.name),
  address: business.offices.map((o) => ({
    "@type": "PostalAddress",
    streetAddress: o.address,
    addressLocality: o.cityStateZip.split(",")[0],
    addressRegion: "NY",
    postalCode: o.cityStateZip.split("NY")[1]?.trim() ?? "",
    addressCountry: "US",
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">
        {/* Skip link: invisible until a keyboard user tabs to it */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-atlantic focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MobileCallBar />
        {/* Spacer so the fixed mobile bar never covers footer content */}
        <div aria-hidden className="h-16 md:hidden" />
      </body>
    </html>
  );
}
