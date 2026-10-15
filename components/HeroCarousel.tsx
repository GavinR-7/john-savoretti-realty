"use client";

import { useState, useEffect } from "react";
import { formatPrice, type Listing } from "@/data/listings";
import PropertyImage from "@/components/PropertyImage";
import Link from "next/link";

const AUTO_ADVANCE_MS = 5000;

export default function HeroCarousel({ listings }: { listings: Listing[] }) {
  // Only show sale listings in the hero spotlight — rentals/commercial
  // have their own pages and this is the seller-facing front door. The
  // caller (a server component) does that filtering via getSaleListings().
  const spotlights = listings;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // flips true on manual click

  // ↓↓↓ YOU WRITE THIS ↓↓↓
  // The auto-advance effect.
  // - If isPaused, do nothing (return early — like the count-up's `if (!hasStarted) return`)
  // - Otherwise setInterval that moves index forward, wrapping with %
  // - Return a cleanup that clears the interval
  useEffect(() => {

    if (isPaused) return;   // early guard — don't start a timer at all

    const id = setInterval(() => {
        setIndex((i) => (i + 1) % spotlights.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(id);   // cleanup, inside the effect

  }, [isPaused, spotlights.length]);
  // ↑↑↑ YOU WRITE THIS ↑↑↑

  // ↓↓↓ YOU WRITE THESE ↓↓↓
  // next() and prev(): move the index (wrapping!), and pause the auto-advance.
  function next() {
    setIndex((i) => (i + 1) % spotlights.length)
    setIsPaused(true)
  }
  function prev() {
    setIndex((i) => (i - 1 + spotlights.length) % spotlights.length)
    setIsPaused(true)
  }
  // ↑↑↑ YOU WRITE THESE ↑↑↑

  const current = spotlights[index];

  // The data is now a live query rather than a hardcoded array, so an empty
  // result is possible (nothing synced yet, everything filtered out). Without
  // this, `current` is undefined and the whole homepage 500s.
  if (!current) return null;

  return (
    <div className="relative">
      {/*
        All slides live in one flex track that we translate by -index * 100%,
        so moving between them animates instead of hard-cutting. `overflow
        hidden` on the viewport clips the rest.

        motion-reduce:transition-none drops the animation for anyone who has
        asked their OS for reduced motion — the slide still changes, it just
        arrives instantly.
      */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {spotlights.map((listing, i) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.mls}`}
              className="relative block w-full shrink-0"
              // Only the visible slide is a tab stop / exposed to screen readers.
              aria-hidden={i !== index}
              tabIndex={i === index ? undefined : -1}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <PropertyImage
                  src={listing.image}
                  alt={`${listing.style} for sale in ${listing.city}`}
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-fog/95 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brass-deep">
                  {listing.status}
                </p>
                <p className="font-display text-lg font-semibold text-harbor">
                  {listing.city} {listing.style} ·{" "}
                  {formatPrice(listing.price, listing.dealType)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <button type="button" onClick={prev} aria-label="Previous listing"
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white">
        ←
      </button>
      <button type="button" onClick={next} aria-label="Next listing"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white">
        →
      </button>
    </div>
  );
}
