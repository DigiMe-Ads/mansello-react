"use client";

import Image from "next/image";
import { Plane } from "lucide-react";
import { useContent } from "@/components/content-provider";

export default function OurHome() {
  const { c } = useContent();
  const photos = [
    { name: "Exterior", image: c("sri_lanka.villaPhotos.ourHomeImage1") },
    { name: "Living Room", image: c("sri_lanka.villaPhotos.ourHomeImage2") },
    { name: "Kitchen", image: c("sri_lanka.villaPhotos.ourHomeImage3") },
  ];

  return (
    <section className="relative overflow-hidden bg-[#DCEEEA] px-6 pb-40 pt-20 sm:px-12 lg:px-20">
      {/* Cloud silhouette, bottom of section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 sm:h-80">
        <Image
          src="/images/sri-lanka/about/our-home/clouds.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-[#153C4D] sm:text-4xl">
          Our Home in Sri Lanka
        </h2>

        {/* Faint decorative flight-path doodle */}
        <svg
          className="pointer-events-none absolute left-1/2 top-16 h-10 w-72 -translate-x-1/2 text-[#153C4D] opacity-10"
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
        <Plane
          className="pointer-events-none absolute left-[42%] top-[4.5rem] h-4 w-4 -rotate-12 text-[#153C4D] opacity-10"
        />

        <p className="relative mt-6 text-sm leading-relaxed text-slate-500 sm:text-base">
          Dona&apos;s Villa sits in Pamunugama, a peaceful fishing village
          between the Negombo lagoon and the Indian Ocean, just 25 minutes
          from Bandaranaike International Airport. We welcome travellers
          arriving into Colombo with a quiet coastal retreat and dependable
          airport transfers — so your first and last days on
          the island are as relaxed as everything in between.
        </p>

        <p className="mt-5 text-sm leading-relaxed text-slate-500 sm:text-base">
          Through our Marketplace, we also bring a little of our second home
          back with us: genuine Italian products, sourced in Bologna and
          delivered across Sri Lanka.
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-14 grid max-w-6xl gap-8 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.name}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lg">
              <Image
                src={photo.image}
                alt={photo.name}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="relative z-10 -mt-8 mx-auto w-[85%] rounded-full bg-white px-6 py-4 text-center shadow-md">
              <span className="text-lg font-bold text-[#153C4D]">
                {photo.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
