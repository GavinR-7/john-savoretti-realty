"use client";

import { useState, useEffect } from "react";
import { saleListings, formatPrice } from "@/data/listings";
import PropertyImage from "@/components/PropertyImage";
import Link from "next/link";

const AUTO_ADVANCE_MS = 5000;

export default function HeroCarousel() {
  // Only show sale listings in the hero spotlight — rentals/commercial
  // have their own pages and this is the seller-facing front door.
  const spotlights = saleListings;

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

  return (
    <div className="relative">
      <Link href={`/areas/${current.areaSlug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <PropertyImage
            src={current.image}
            alt={`${current.style} for sale in ${current.city}`}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-fog/95 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brass-deep">
            {current.status}
          </p>
          <p className="font-display text-lg font-semibold text-harbor">
            {current.city} {current.style} · {formatPrice(current.price, current.dealType)}
          </p>
        </div>
      </Link>

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