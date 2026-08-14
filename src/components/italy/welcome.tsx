"use client";

import Image from "next/image";
import { useState } from "react";
import { ReservationWidget } from "@/components/booking/reservation-widget";

const villaImages = [
  "/images/italy/nest-bologna/nest-bologna-living-room-1.webp",
  "/images/italy/nest-bologna/nest-bologna-bedroom-1.webp",
  "/images/italy/nest-bologna/nest-bologna-kitchen-1.webp",
  "/images/italy/nest-bologna/nest-bologna-exterior-1.webp",
];

const highlights = [
  "Studio for 1–4 guests, from 85€ per night",
  "Easy reach of Bologna Guglielmo Marconi Airport (BLQ)",
  "Airport pick-up and drop-off available",
  "Fully equipped kitchen",
  "10 minutes from Bologna Main Station",
  "5 minutes from Bologna Fiera",
  "13 minutes from Bologna Airport",
];

export default function Welcome() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <section className="bg-[#DCEEEA] px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left column */}
        <div>
          <h2 className="text-3xl font-bold text-[#153C4D] sm:text-4xl">
            Welcome to The Nest Bologna
          </h2>

          <p className="mt-5 text-justify text-sm leading-relaxed text-slate-600 sm:text-base">
            Tucked into a quiet residential corner of Bologna, The Nest is a cosy,
            family-run stay built around one idea: arriving in Italy should feel like coming home.
          </p>

          <p className="mt-4 text-justify text-sm leading-relaxed text-slate-600 sm:text-base">
            Wake up minutes from Bologna&apos;s historic centre and reach Bologna
            Guglielmo Marconi Airport with ease — perfect for your first or last night
            in the food capital of Italy, or as a relaxed base to explore Emilia-Romagna.
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
          <ReservationWidget propertySlug="the-nest-bologna" airbnbHref="/italy/airbnb" />
        </div>

        {/* Right column — image carousel */}
        <div className="flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[3rem] rounded-tr-[7rem] rounded-bl-[7rem] border-[10px] border-white shadow-lg">
            <Image
              src={villaImages[activeImage]}
              alt="The Nest Bologna"
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
