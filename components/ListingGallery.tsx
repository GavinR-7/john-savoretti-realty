"use client";

/*
  Listing photos: a swipeable carousel, with a full-screen lightbox behind a
  "View all photos" action.

  This replaced a big photo plus a grid of every thumbnail, which on a phone
  meant scrolling past ten rows of thumbnails before reaching the beds, baths,
  and price — the facts people actually came for.

  The swipe itself is CSS scroll-snap rather than a JS drag handler: it gets
  native inertia and rubber-banding on touch, keeps working if JS is slow, and
  the arrows just call scrollTo(). The active dot is derived from scrollLeft.
*/
import { useCallback, useEffect, useRef, useState } from "react";
import PropertyImage from "@/components/PropertyImage";

type ListingGalleryProps = {
  images: string[]; // [mainImage, ...gallery]
  alt: string;
  status?: string;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ListingGallery({ images, alt, status }: ListingGalleryProps) {
  const photos = images.filter(Boolean);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);

  // Derive the active slide from scroll position so swipe, arrows, and dots
  // all agree without anyone owning the state.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === i ? prev : i));
  }, []);

  const scrollToSlide = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(i, photos.length - 1));
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [photos.length]);

  // No photos yet — render the single branded placeholder, nothing to swipe.
  if (photos.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <PropertyImage src="" alt={alt} priority sizes="(max-width: 1024px) 100vw, 58vw" />
      </div>
    );
  }

  const single = photos.length === 1;

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${alt} — ${photos.length} photos`}
        >
          {photos.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              onClick={() => setLightboxAt(i)}
              aria-label={`View photo ${i + 1} of ${photos.length} full screen`}
              className="relative aspect-[4/3] w-full shrink-0 snap-center cursor-zoom-in"
            >
              <PropertyImage
                src={image}
                alt={`${alt} — photo ${i + 1}`}
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </button>
          ))}
        </div>

        {status && (
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-harbor/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {status}
          </span>
        )}

        {!single && (
          <>
            <button
              type="button"
              onClick={() => scrollToSlide(active - 1)}
              disabled={active === 0}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white disabled:opacity-0"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollToSlide(active + 1)}
              disabled={active === photos.length - 1}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-atlantic shadow transition hover:bg-white disabled:opacity-0"
            >
              →
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-harbor/80 px-2.5 py-1 text-xs font-semibold text-white">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {!single && (
        <div className="mt-3 flex items-center justify-between gap-4">
          {/* Dots: capped so 20+ photos don't produce a wall of them. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {photos.slice(0, 10).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-5 bg-atlantic" : "w-2 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
            {photos.length > 10 && (
              <span className="ml-1 text-xs font-medium text-mist">
                +{photos.length - 10}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setLightboxAt(active)}
            className="shrink-0 rounded-md border border-atlantic/20 px-3 py-2 text-sm font-semibold text-atlantic transition hover:border-atlantic/50"
          >
            View all photos ({photos.length})
          </button>
        </div>
      )}

      {lightboxAt !== null && (
        <Lightbox
          photos={photos}
          alt={alt}
          startAt={lightboxAt}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </div>
  );
}

/*
  Full-screen viewer. Escape closes, ← / → move, and clicking the photo (or
  pressing Enter on it) toggles a 2x zoom — when zoomed the frame becomes
  scrollable so you can pan around it.
*/
function Lightbox({
  photos, alt, startAt, onClose,
}: {
  photos: string[];
  alt: string;
  startAt: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startAt);
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((delta: number) => {
    setZoomed(false);
    setIndex((i) => Math.max(0, Math.min(i + delta, photos.length - 1)));
  }, [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Pin the page behind the overlay, and hand focus to the close button so
  // keyboard users land somewhere useful.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { scrollY } = window;
    const { body } = document;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    closeRef.current?.focus();
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[100] flex flex-col bg-harbor/95"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-pressed={zoomed}
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:border-white"
          >
            {zoomed ? "Zoom out" : "Zoom in"}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:border-white"
          >
            Close ✕
          </button>
        </div>
      </div>

      <div className={`relative flex-1 ${zoomed ? "overflow-auto" : "overflow-hidden"}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setZoomed((z) => !z)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setZoomed((z) => !z);
            }
          }}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className={`relative mx-auto ${
            zoomed ? "h-[200%] w-[200%] cursor-zoom-out" : "h-full w-full cursor-zoom-in"
          }`}
        >
          <PropertyImage
            src={photos[index]}
            alt={`${alt} — photo ${index + 1}`}
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className="rounded-full bg-white/90 px-4 py-2 font-semibold text-atlantic transition hover:bg-white disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
            className="rounded-full bg-white/90 px-4 py-2 font-semibold text-atlantic transition hover:bg-white disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
