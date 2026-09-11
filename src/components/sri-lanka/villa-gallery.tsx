"use client";

import Image from "next/image";
import { Plane } from "lucide-react";
import { useContent } from "@/components/content-provider";

export default function VillaGallery() {
  const { c } = useContent();
  const gallery = [
    [
      { src: c("sri_lanka.villaPhotos.galleryImage1"), alt: "Living room at Dona's Villa with cane armchairs" },
      { src: c("sri_lanka.villaPhotos.galleryImage2"), alt: "Guest bedroom at Dona's Villa" },
    ],
    [
      { src: c("sri_lanka.villaPhotos.galleryImage3"), alt: "Kitchen and dining area at Dona's Villa" },
      { src: c("sri_lanka.villaPhotos.galleryImage4"), alt: "Front facade of Dona's Villa" },
    ],
    [
      { src: c("sri_lanka.villaPhotos.galleryImage5"), alt: "Living room seating area at Dona's Villa" },
      { src: c("sri_lanka.villaPhotos.galleryImage6"), alt: "Bathroom at Dona's Villa" },
    ],
  ];

  return (
    <section className="relative overflow-hidden bg-[#DCEEEA] px-6 py-20 sm:px-12 lg:px-20">
      {/* Pink balloon, peeking in from the left edge */}
      <div className="pointer-events-none absolute -left-8 top-10 z-0 h-32 w-28 sm:h-40 sm:w-36">
        <Image
          src="/images/sri-lanka/steps/hot-air-balloon.webp"
          alt=""
          fill
          sizes="(min-width: 640px) 144px, 112px"
          className="object-contain"
          style={{ filter: "hue-rotate(160deg) saturate(1.4)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          <span className="text-[#F5A623]">Dona&apos;s Villa</span>{" "}
          <span className="text-[#153C4D]">- Pamunugama, Sri Lanka</span>
        </h2>

        {/* Faint decorative flight-path doodle */}
        <svg
          className="pointer-events-none absolute left-1/2 top-12 h-10 w-72 -translate-x-1/2 text-[#153C4D] opacity-10"
          viewBox="0 0 300 40"
          fill="none"
        >
          <path
            d="M10 25 Q 90 5, 160 20 T 290 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 5"
          />
          <circle cx="160" cy="20" r="2" fill="currentColor" />
          <circle cx="230" cy="14" r="2" fill="currentColor" />
        </svg>
        <Plane className="pointer-events-none absolute left-[42%] top-11 h-4 w-4 -rotate-12 text-[#153C4D] opacity-10" />

        <p className="relative mt-4 text-sm text-slate-500 sm:text-base">
          No. 187, Kepungoda, Pamunugama, Sri Lanka
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-3">
        {gallery.map((column, i) => (
          <div key={i} className="flex flex-col gap-6">
            {column.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
