/*
  ABOUT — a server component (no "use client") because it's pure display:
  no state, no event handlers, no browser APIs. Server components ship zero
  JavaScript to the visitor, which keeps the page fast.

  The headshot is a clearly-labeled placeholder. When John sends a photo,
  drop it in /public/john.jpg and swap the placeholder block for:
    <Image src="/john.jpg" alt="John Savoretti" fill className="object-cover" />
  (import Image from "next/image" at the top.)
*/

import { business } from "@/data/site";

function formatStat(stat: (typeof business.stats)[number]) {
  return stat.animate ? `${stat.prefix}${stat.target}${stat.suffix}` : stat.value;
}

export default function AboutSection() {
  const soldStat = business.stats[0];
  const homesStat = business.stats[1];

  return (
    <section id="about" className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[2fr_3fr] md:py-28">
        {/* Headshot placeholder card */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-harbor via-atlantic to-channel">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <span className="font-display text-7xl font-semibold text-brass-light">
                JS
              </span>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Headshot placeholder
              </p>
              <p className="max-w-[16rem] text-sm text-white/70">
                Drop John&rsquo;s photo here before the pitch — see the README
                swap-in checklist.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Broker / Owner", "Est. 2001", "BBB A+ accredited"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-atlantic/15 bg-fog px-3 py-1 text-xs font-medium text-atlantic"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Story */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
            About the brokerage
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-harbor sm:text-4xl">
            Family-run since 2001 — and it still runs that way.
          </h2>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-mist">
            <p>
              John Savoretti opened the doors on Hempstead Turnpike in 2001.
              Twenty-five years later, the brokerage has grown to 30+ agents
              across two offices — Franklin Square in Nassau and Smithtown in
              Suffolk — but it&rsquo;s still the kind of place where the
              broker&rsquo;s name is on the door and he picks up the phone.
            </p>
            <p>
              The approach hasn&rsquo;t changed either: tell people the truth
              about what their home is worth, never push anyone into a deal,
              and treat every transaction like the family purchase it is. Most
              of the business comes from past clients and their kids — that
              only happens when you do it right the first time.
            </p>
            <p>
              The results back it up: {formatStat(soldStat)} in homes sold
              over the last twelve months, {formatStat(homesStat)}{" "}
              families moved last year, and an A+ rating from the Better
              Business Bureau.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={business.phoneNassauHref}
              className="inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
            >
              Call John&rsquo;s office — {business.phoneNassau}
            </a>
            <a
              href="/#contact"
              className="inline-flex items-center justify-center rounded-lg border border-atlantic/20 px-5 py-3 text-sm font-semibold text-atlantic transition hover:border-atlantic/50"
            >
              Send a message
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
