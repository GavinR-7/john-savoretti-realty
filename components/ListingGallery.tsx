"use client";

import { useState } from "react";
import PropertyImage from "@/components/PropertyImage";

type ListingGalleryProps = {
  images: string[]; // [mainImage, ...gallery]
  alt: string;
  status?: string;
};

export default function ListingGallery({ images, alt, status }: ListingGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* The big photo — always shows images[active] */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <PropertyImage
          src={images[active]}
          alt={alt}
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
        />
        {status && (
          <span className="absolute left-4 top-4 rounded-full bg-harbor/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {status}
          </span>
        )}
      </div>

      {/* Thumbnails — clicking one makes it the big photo */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg ${
                i === active ? "ring-2 ring-atlantic" : ""
              }`}
            >
              <PropertyImage
                src={image}
                alt={`${alt} — photo ${i + 1}`}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
