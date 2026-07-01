/*
  Hero — the thesis of the page.
  Left: a seller-magnet headline (sellers are the #1 lead the business wants),
  with both CTAs. Right: a photo card spotlighting a REAL current exclusive
  (pulled from the listings data so it never goes out of sync). Below: the
  trust strip with the brokerage's five proof points.

  No "use client" here — there's no state, so this renders on the server and
  ships as plain HTML. Server by default, client only when needed.
*/

import Link from "next/link";
import PropertyImage from "@/components/PropertyImage";
import { business } from "@/data/site";
import { listings, formatPrice } from "@/data/listings";

export default function Hero() {
  const spotlight = listings.find((l) => l.id === "garden-city-tudor") ?? listings[0];

  return (
    <section aria-label="Welcome">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:pt-20">
        {/* Left: message + CTAs */}
        <div className="lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass-deep">
            Nassau · Suffolk · Queens — family-run since 2001
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-atlantic sm:text-5xl lg:text-[3.4rem]">
            Get top dollar for your Long Island home — without the pressure.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-mist">
            30+ agents, two offices, and {business.stats[0].value.replace("+", "")} sold in the
            last 12 months. We&rsquo;ll tell you what your home is really worth, and we&rsquo;ll
            never push you to list it.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#listings"
              className="rounded-md bg-atlantic px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-channel"
            >
              Search homes
            </Link>
            <Link
              href="/#home-value"
              className="rounded-md border-2 border-atlantic px-6 py-3 text-base font-semibold text-atlantic transition-colors hover:bg-fog"
            >
              Get your home&rsquo;s value
            </Link>
          </div>
          <p className="mt-6 text-sm text-mist">
            BBB A+ accredited · 5.0★ rated · Talk to a person today:{" "}
            <a href={business.phoneNassauHref} className="font-semibold text-atlantic underline decoration-brass underline-offset-4">
              {business.phoneNassau}
            </a>
          </p>
        </div>

        {/* Right: real-listing spotlight */}
        <div className="lg:col-span-6">
          <Link
            href={`/areas/${spotlight.areaSlug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-xl shadow-atlantic/20"
          >
            <PropertyImage
              src={spotlight.image}
              alt={`${spotlight.style} for sale in ${spotlight.town} — ${formatPrice(spotlight.price, spotlight.dealType)}`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-lg bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition-transform group-hover:-translate-y-0.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-deep">
                  Just listed
                </p>
                <p className="font-display text-base font-semibold text-atlantic">
                  {spotlight.town} {spotlight.style} · {formatPrice(spotlight.price, spotlight.dealType)}
                </p>
              </div>
              <span aria-hidden="true" className="text-atlantic transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-atlantic">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
          {business.stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <dd className="font-display text-3xl font-semibold text-brass-light">
                {stat.value}
              </dd>
              <dt className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white/65">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
