"use client";

/*
  TESTIMONIALS CAROUSEL — a "use client" component because it has state
  (which slide is showing) and click handlers.

  How the slide mechanic works:
  - All slides sit side-by-side in a flex row inside an overflow-hidden frame.
  - We shift the whole row left with transform: translateX(-index * 100%).
  - CSS `transition` animates the shift. That's the entire carousel — no library.

  No autoplay on purpose: auto-advancing text is an accessibility problem
  (people read at different speeds) and it tanks engagement on mobile.

  Every sample review renders a visible badge so John never mistakes filler
  for real reviews during the demo. Real ones: paste the exact quotes into
  data/testimonials.ts and set isSample: false.
*/

import { useState } from "react";
import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section id="testimonials" className="bg-fog">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 md:py-28">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
          What clients say
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-harbor sm:text-4xl">
          Twenty-five years of happy closings
        </h2>

        {/* The viewport: hides everything except the active slide */}
        <div className="mt-10 overflow-hidden">
          {/* The track: all slides in a row, shifted by transform */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {testimonials.map((t) => (
              <figure
                key={t.quote}
                className="w-full shrink-0 px-2 text-center sm:px-8"
              >
                {t.isSample && (
                  <span className="mb-4 inline-block rounded-full bg-brass/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brass-deep">
                    Sample review — your real Google reviews drop in here
                  </span>
                )}
                <blockquote className="font-display text-xl leading-relaxed text-ink sm:text-2xl">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm font-medium text-mist">
                  {t.name} · {t.town}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous review"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-atlantic/20 text-atlantic transition hover:bg-atlantic hover:text-white"
          >
            ←
          </button>

          <div className="flex gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.quote}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to review ${i + 1}`}
                aria-current={i === index}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === index ? "bg-atlantic" : "bg-atlantic/25 hover:bg-atlantic/50"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next review"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-atlantic/20 text-atlantic transition hover:bg-atlantic hover:text-white"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
