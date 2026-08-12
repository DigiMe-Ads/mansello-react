"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Route, TicketCheck, Luggage } from "lucide-react";
import { getActiveOffer } from "@/lib/api/offers";
import { getPropertyBySlug } from "@/lib/api/properties";
import { isRenderableImageSrc } from "@/lib/image";
import type { Offer } from "@/lib/api/types";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: typeof Route;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Choose Your Dates",
    description:
      "Pick your check-in and check-out dates and number of guests. Our calendar shows live availability.",
    icon: Route,
  },
  {
    number: "02",
    title: "Confirm Your Booking",
    description:
      "Reserve your room in minutes. Add an airport transfer at checkout so we're waiting when you land.",
    icon: TicketCheck,
  },
  {
    number: "03",
    title: "Arrive & Relax",
    description:
      "Your driver meets you at arrivals and brings you straight to The Nest Bologna.",
    icon: Luggage,
  },
];

export default function Steps() {
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPropertyBySlug("the-nest-bologna")
      .then((property) => getActiveOffer(property.id))
      .then((result) => {
        if (!cancelled) setOffer(result);
      })
      .catch(() => {
        // No active offer configured yet (or the endpoint isn't live until
        // BACKEND_CHANGES.md is implemented) — the deal card just doesn't render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white px-6 py-30 sm:px-12 lg:px-30">
      <div className="relative mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
          <span className="text-[#F5A623]">3 Easy Steps</span>{" "}
          <span className="text-[#1B4B4F]">for Book</span>
          <br />
          <span className="text-[#1B4B4F]">Your Next Trip</span>
        </h2>

        <div
          className={`mt-12 grid gap-10 lg:gap-8 ${
            offer ? "lg:grid-cols-[220px_1fr_380px]" : "lg:grid-cols-[1fr_380px]"
          }`}
        >
          {/* Deal card — only rendered when the property has an active offer */}
          {offer && (
            <div className="mx-auto w-full max-w-[220px] self-start overflow-hidden rounded-[28px] shadow-lg lg:mx-0">
              <div className="relative h-[190px] w-full bg-[#1B4B4F]">
                {offer.imageUrl && isRenderableImageSrc(offer.imageUrl) && (
                  <Image src={offer.imageUrl} alt={offer.title} fill sizes="220px" className="object-cover" />
                )}
              </div>
              <div className="bg-[#F5A623] px-5 py-4 text-white">
                <p className="text-xs font-medium">{offer.title}</p>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-5xl font-extrabold leading-none">{offer.discountPercent}</span>
                  <div className="flex flex-col pb-1 leading-none">
                    <span className="text-lg font-bold">%</span>
                    <span className="text-sm font-semibold">OFF</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps list */}
          <div className="flex flex-col justify-center gap-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex items-center gap-4 rounded-[28px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,60,60,0.1)]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1B4B4F] text-2xl font-bold text-white">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#1B4B4F]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#F5A623] text-[#F5A623]">
                  <step.icon size={24} strokeWidth={1.75} />
                </div>
              </div>
            ))}
          </div>

          {/* Visual */}
          <div className="relative mx-auto h-[480px] w-full max-w-[380px] lg:mx-0">
            {/* Soft blurred backdrop glow */}
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5A623]/15 blur-3xl" />

            {/* Cloud, behind the balloons */}
            <div className="absolute left-0 top-[28%] z-0 h-32 w-44">
              <Image
                src="/images/sri-lanka/steps/clouds-3.webp"
                alt=""
                fill
                sizes="176px"
                className="object-contain"
              />
            </div>

            {/* Small pink balloon, behind the woman */}
            <div className="absolute bottom-[30%] left-0 z-0 h-24 w-20">
              <Image
                src="/images/sri-lanka/steps/hot-air-balloon.webp"
                alt=""
                fill
                sizes="80px"
                className="object-contain"
                style={{ filter: "hue-rotate(160deg) saturate(1.4)" }}
              />
            </div>

            {/* Big teal balloon */}
            <div className="absolute right-0 top-0 z-10 h-36 w-28">
              <Image
                src="/images/sri-lanka/steps/hot-air-balloon.webp"
                alt=""
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>

            {/* Woman with suitcase */}
            <div className="absolute bottom-0 left-1/2 z-10 h-[440px] w-[300px] -translate-x-1/2">
              <Image
                src="/images/sri-lanka/steps/woman-suitcase.webp"
                alt="Traveler laughing while sitting on her suitcase"
                fill
                sizes="300px"
                className="object-contain object-bottom"
              />
            </div>

            {/* "For Summer!" vertical script label */}
            <div
              className="pointer-events-none absolute -right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center"
              style={{ writingMode: "vertical-rl" }}
            >
              <span
                className="rotate-180 text-3xl text-[#F5A623]"
                style={{ fontFamily: "var(--font-script)" }}
              >
                Summer!
              </span>
              <span
                className="mt-1 rotate-180 text-xl text-[#1B4B4F]"
                style={{ fontFamily: "var(--font-script)" }}
              >
                For
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
