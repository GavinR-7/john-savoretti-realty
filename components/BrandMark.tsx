"use client";

/*
  The brokerage crest, with the old "JS" roundel as a fallback.

  next/image can't tell us at build time whether /public/logo.png exists, so
  we render the image and swap to the roundel on its error event — which also
  covers a corrupt or half-uploaded file, not just a missing one. Explicit
  width/height come from the real asset so the layout never shifts.

  ⚠️ The artwork is NOT recoloured or altered anywhere — it's the client's
  trademark. On dark surfaces we put it on a light plate instead (see `plate`),
  because the crest is dark navy and scores 1.18:1 against the footer navy.
*/
import Image from "next/image";
import { useState } from "react";

// Measured from the actual asset. Keep in step if the artwork is replaced —
// a stale ratio here distorts the crest.
const INTRINSIC_WIDTH = 1254;
const INTRINSIC_HEIGHT = 1254;

export default function BrandMark({
  size,
  className = "",
  priority = false,
  plate = false,
}: {
  /** Rendered height in px; width follows the crest's aspect ratio. */
  size: number;
  className?: string;
  priority?: boolean;
  /** Sit the crest on a light rounded plate — for dark backgrounds. */
  plate?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const width = Math.round((size * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={{ height: size, width: size }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-atlantic font-display font-semibold text-brass-light ${className}`}
      >
        JS
      </span>
    );
  }

  const img = (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={width}
      height={size}
      priority={priority}
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${plate ? "" : className}`}
    />
  );

  if (!plate) return img;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white/95 p-2 shadow-sm ${className}`}
    >
      {img}
    </span>
  );
}
