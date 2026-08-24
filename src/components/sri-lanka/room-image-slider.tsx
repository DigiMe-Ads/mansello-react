"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isRenderableImageSrc } from "@/lib/image";

// A room can have one photo or several — with several, this renders a
// simple prev/next + dot-indicator slider instead of just the first image.
// No dependency: matches this repo's existing hand-rolled interaction style
// (see MonthGridView in booking-calendar-view.tsx).
export function RoomImageSlider({ images, alt }: { images: string[]; alt: string }) {
  const renderable = images.filter(isRenderableImageSrc);
  const [index, setIndex] = useState(0);

  if (renderable.length === 0) {
    return <div className="h-full w-full bg-slate-100" />;
  }

  if (renderable.length === 1) {
    return (
      <Image
        src={renderable[0]}
        alt={alt}
        fill
        sizes="(min-width: 640px) 320px, 100vw"
        className="object-cover"
      />
    );
  }

  const current = ((index % renderable.length) + renderable.length) % renderable.length;

  return (
    <div className="group/slider relative h-full w-full">
      <Image
        src={renderable[current]}
        alt={alt}
        fill
        sizes="(min-width: 640px) 320px, 100vw"
        className="object-cover"
      />

      <button
        type="button"
        aria-label="Previous photo"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => i - 1);
        }}
        className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover/slider:opacity-100"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => i + 1);
        }}
        className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover/slider:opacity-100"
      >
        <ChevronRight size={14} />
      </button>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {renderable.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Photo ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-1.5 w-1.5 rounded-full transition ${i === current ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
