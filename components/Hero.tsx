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
import { business } from "@/data/site";
import type { Listing } from "@/data/listings";
import CountUpStat from "@/components/CountUpStat";
import HeroCarousel from "@/components/HeroCarousel";

// The carousel is a client component and can't query the DB itself, so the
// listings are fetched in app/page.tsx and passed straight through.
export default function Hero({ listings }: { listings: Listing[] }) {
  const soldStat = business.stats[0];

  return (
    <section aria-label="Welcome">
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:pt-12">
        {/* Left: message + CTAs */}
        <div className="lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-deep">
            Nassau · Suffolk · Queens — family-run since 2001
          </p>

          {/*
            The brand leads. h1 is the business name at the top of the type
            scale, the slogan sits under it in brass, and the old headline
            steps down to a supporting subheading — same scale and palette,
            reordered so the name is unmistakably the largest thing here.

            The grid is items-start, not items-center: the carousel column is
            taller than this one, and centring it dropped the text well below
            the fold on desktop.
          */}
          <h1 className="mt-3 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight text-atlantic sm:text-6xl lg:text-[4.25rem]">
            {business.name}
          </h1>
          <p className="mt-2 font-display text-2xl font-semibold italic leading-snug text-brass-deep sm:text-3xl">
            Home of the Dream Team!
          </p>
          <p className="mt-4 max-w-xl text-balance font-display text-2xl font-semibold leading-snug text-harbor sm:text-3xl">
            Get top dollar for your home — without the pressure.
          </p>

          <p className="mt-3 max-w-xl text-lg text-mist">
            30+ agents, two offices, and{" "}
            {soldStat.animate
              ? `${soldStat.prefix}${soldStat.target}${soldStat.suffix}`
              : soldStat.value}{" "}
            sold in the last 12 months. We&rsquo;ll tell you what your home is really worth, and we&rsquo;ll
            never push you to list it.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/buy"
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

        {/* Right: real-listing spotlight carousel */}
        <div className="lg:col-span-6">
          <HeroCarousel listings={listings} />
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-atlantic">
        <dl className="mx-auto grid max-w-7xl section-y-tight grid-cols-2 gap-x-6 gap-y-8 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
          {business.stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <dd className="font-display text-3xl font-semibold text-brass-light">
                {stat.animate ? (
                  <CountUpStat target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
                ) : (
                  stat.value
                )}
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