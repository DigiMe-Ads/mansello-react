"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ReservationWidget } from "@/components/booking/reservation-widget";

// How long each photo stays up before auto-advancing to the next one.
const AUTO_SWAP_INTERVAL_MS = 5000;

const villaImages = [
  {
    src: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
    alt: "Front facade of Dona's Villa",
  },
  {
    src: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-garden-1.webp",
    alt: "Garden at Dona's Villa",
  },
  {
    src: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-veranda-1.webp",
    alt: "Veranda at Dona's Villa",
  },
  {
    src: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-garden-pathway-1.webp",
    alt: "Garden pathway at Dona's Villa",
  },
];

const highlights = [
  "Rooms for 1–8 guests",
  "25 minutes from Colombo Airport (CMB)",
  "Airport pick-up and drop-off available",
  "Air-conditioned rooms",
];

export default function Welcome() {
  const [activeImage, setActiveImage] = useState(0);

  // Auto-advance through the photos, same as clicking the dots — clicking a
  // dot still works at any time, it just resets which photo shows next.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((i) => (i + 1) % villaImages.length);
    }, AUTO_SWAP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#DCEEEA] px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left column */}
        <div>
          <h2 className="text-3xl font-bold text-[#153C4D] sm:text-4xl">
            Welcome to Dona&apos;s Villa
          </h2>

          <p className="mt-5 text-justify text-sm leading-relaxed text-slate-600 sm:text-base">
            Tucked away in the quiet fishing village of Pamunugama, between the Negombo
            lagoon and the Indian Ocean, Dona&apos;s Villa is a cosy, family-run
            stay built around one idea: arriving in Sri Lanka should feel like coming home.
          </p>

          <p className="mt-4 text-justify text-sm leading-relaxed text-slate-600 sm:text-base">
            Wake up to birdsong and reach Bandaranaike International Airport in around 25 minutes —
            perfect for your first or last night on the island, or as a relaxed base near Colombo and Negombo.
          </p>

          <div className="mt-8 flex gap-6">
            <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#1B4B4F] text-center">
              <span className="text-xl font-bold text-[#F5A623]">24/7</span>
              <span className="mt-1 text-sm font-medium leading-tight text-white">
                Guide
                <br />
                Support
              </span>
            </div>

            <ul className="flex flex-col justify-center gap-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm font-medium text-[#1B4B4F] sm:text-base"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4B4F]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Booking widget — same property/availability APIs as the Airbnb page */}
          <ReservationWidget propertySlug="donas-villa" airbnbHref="/sri-lanka/airbnb" />
        </div>

        {/* Right column — image carousel */}
        <div className="flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[3rem] rounded-tr-[7rem] rounded-bl-[7rem] border-[10px] border-white shadow-lg">
            <Image
              src={villaImages[activeImage].src}
              alt={villaImages[activeImage].alt}
              fill
              sizes="(min-width: 1024px) 448px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="mt-5 flex gap-2">
            {villaImages.map((_, i) => (
              <button
                key={i}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setActiveImage(i)}
                className={`h-3 w-3 rounded-full border border-[#1B4B4F]/40 transition ${
                  activeImage === i ? "bg-[#1B4B4F]" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}