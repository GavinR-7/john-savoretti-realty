/*
  FOOTER — server component. Three jobs:
  1. Both offices with click-to-call and an embedded Google Map each.
     The maps are plain iframes pointed at google.com/maps?q=...&output=embed —
     no API key needed for this read-only embed style. loading="lazy" keeps
     them from slowing initial page load.
  2. NY compliance links (Fair Housing Notice, Standardized Operating
     Procedures, accommodation notice) — legally required for NY brokers.
     ⚠️ Currently linking to PDFs on the old site vendor's domain; re-host
     in /public/docs/ before launch (see README + data/site.ts).
  3. Standard footer stuff: nav, socials, legal line, copyright.
*/

import { business } from "@/data/site";

const footerLinks = [
  { label: "Buy", href: "/#listings" },
  { label: "Sell", href: "/#home-value" },
  { label: "Areas", href: "/#areas" },
  { label: "Our agents", href: "/#agents" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-harbor text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass-light/50 font-display text-sm font-semibold text-brass-light">
                JS
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-white">
                  {business.name}
                </p>
                <p className="text-xs text-white/50">Est. 2001</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {business.tagline}. Serving Nassau, Suffolk, and Queens families
              with straight answers and no pressure.
            </p>
            <div className="mt-5 flex gap-4 text-sm">
              <a
                href={business.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brass-light hover:text-white"
              >
                Instagram
              </a>
              <a
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brass-light hover:text-white"
              >
                Facebook
              </a>
              <a
                href={`mailto:${business.email}`}
                className="font-medium text-brass-light hover:text-white"
              >
                Email us
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Offices with maps */}
          <div className="space-y-6">
            {business.offices.map((office) => (
              <div key={office.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  {office.name}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {office.address}, {office.cityStateZip}
                </p>
                <a
                  href={office.phoneHref}
                  className="mt-1 inline-block text-sm font-semibold text-brass-light hover:text-white"
                >
                  {office.phone}
                </a>
                <iframe
                  title={`Map to the ${office.name} — ${office.address}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="mt-3 h-36 w-full rounded-lg border-0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Compliance + legal */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <a
              href={business.compliance.fairHousing}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              NYS Fair Housing Notice
            </a>
            <a
              href={business.compliance.sop}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              Standardized Operating Procedures
            </a>
            <a
              href={business.compliance.accommodations}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              Reasonable Accommodations Notice
            </a>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-white/40">
            {business.name} — {business.legalLine}. We are pledged to the
            letter and spirit of U.S. policy for the achievement of equal
            housing opportunity throughout the nation. Listing details are
            believed accurate but are not guaranteed and should be
            independently verified.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
            <p>
              © {new Date().getFullYear()} {business.name}. All rights reserved.
            </p>
            {/* Your builder credit — your quiet referral engine. Swap in your
                name + link, or delete if John prefers a clean footer. */}
            <p>
              Site by <span className="text-white/60">[Your Name]</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
