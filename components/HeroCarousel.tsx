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
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const count = spotlights.length;
  const activeIndex = count ? index % count : 0;
  const autoAdvance = count > 1 && !isPaused && !isHovered && !hasFocus && !reducedMotion;

  useEffect(() => {
    if (!window.matchMedia) {
      setReducedMotion(false);
      return;
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [autoAdvance, count]);

  function next() {
    if (count < 2) return;
    setIndex((value) => (value + 1) % count);
    setIsPaused(true);
  }

  function prev() {
    if (count < 2) return;
    setIndex((value) => (value - 1 + count) % count);
    setIsPaused(true);
  }

  if (!count) return null;

  return (
    <div
      className="relative"
      role="region"
      aria-label="Featured homes"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      {/*
        All slides live in one flex track that we translate by -index * 100%,
        so moving between them animates instead of hard-cutting. `overflow
        hidden` on the viewport clips the rest.

        Reduced-motion preferences pause automatic changes and remove
        the slide transition. The arrows remain available.
      */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {spotlights.map((listing, i) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.mls}`}
              className="relative block w-full shrink-0"
              // Only the visible slide is a tab stop / exposed to screen readers.
              aria-hidden={i !== activeIndex}
              tabIndex={i === activeIndex ? undefined : -1}
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
                <p className="mt-1 text-[11px] leading-snug text-mist">
                  MLS #{listing.mls}
                  {listing.listOfficeName && ` · Listing courtesy of ${listing.listOfficeName}`}
                </p>
                {listing.status === "Coming soon" && listing.onMarketDate && (
                  <p className="text-[11px] text-mist">On market {listing.onMarketDate}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous listing"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next listing"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white"
          >
            →
          </button>
          <div className="mt-3 flex items-center justify-between text-xs text-mist">
            <p aria-live={autoAdvance ? "off" : "polite"} aria-atomic="true">
              Listing {activeIndex + 1} of {count}
            </p>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setIsPaused((value) => !value)}
                className="rounded px-2 py-1 font-medium text-atlantic underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {isPaused ? "Play slideshow" : "Pause slideshow"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
