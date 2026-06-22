"use client";

/*
  Every property photo on the site renders through this component.

  Why it exists: the sample photos are remote placeholder URLs. If one ever
  404s in the middle of a demo, a broken-image icon would torpedo the pitch.
  So on error (or if no src is given) we render an intentional-looking
  branded fallback instead — navy gradient, house mark, "Photo coming soon."

  next/image (instead of a plain <img>) gives free performance wins:
  automatic resizing, modern formats (WebP/AVIF), and lazy loading — all
  things Lighthouse scores you on.
*/

import Image from "next/image";
import { useState } from "react";

type PropertyImageProps = {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean; // true only for the hero image (it's above the fold)
};

export default function PropertyImage({
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: PropertyImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-atlantic to-harbor"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-10 w-10 text-brass-light"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8M9.5 20v-5.5h5V20"
          />
        </svg>
        <span className="text-xs uppercase tracking-widest text-white/60">
          Photo coming soon
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      onError={() => setErrored(true)}
    />
  );
}
