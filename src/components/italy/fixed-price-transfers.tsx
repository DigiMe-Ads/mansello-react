"use client";

import { useState } from "react";
import Image from "next/image";
import { Signpost } from "lucide-react";
import { TransportRequestForm } from "@/components/transport/transport-request-form";

const transfers = [
  {
    title: "Airport → The Nest Bologna",
    description:
      "Meet & greet at arrivals, private air-conditioned vehicle, door-to-door drop-off - contact us for a flat-rate quote",
  },
  {
    title: "The Nest Bologna → Airport",
    description:
      "Scheduled pick-up from the apartment with guaranteed on-time arrival for your flight - contact us for a flat-rate quote",
  },
];

export default function FixedPriceTransfers() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="transfer-request" className="bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl items-start gap-16 lg:grid-cols-[440px_1fr]">
        {/* Left: photo */}
        <div className="relative mx-auto h-160 w-full max-w-120">
          <div className="absolute left-4 top-8 h-80 w-80 rounded-full bg-[#F9E3C6]/60" />

          <div className="relative h-full w-full">
            <Image
              src="/images/new-traveller.webp"
              alt="Traveler with luggage, ready for their transfer"
              fill
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Right: copy */}
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            <span className="text-[#153C4D]">Flat-Rate</span>{" "}
            <span className="text-[#F5A623]">Transfers</span>
          </h2>

          <div className="mt-6 flex flex-col gap-4">
            {transfers.map((t) => (
              <div
                key={t.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 px-5 py-4"
              >
                <Signpost
                  className="mt-0.5 h-6 w-6 shrink-0 text-[#153C4D]"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="font-bold text-[#153C4D]">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {t.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-3xl font-bold sm:text-4xl">
            <span className="text-[#153C4D]">Custom</span>{" "}
            <span className="text-[#F5A623]">Transport Packages</span>
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Going further than the airport?
          </p>

          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            We arrange private day trips and multi-day transport across
            northern Italy, adjusted to your itinerary and budget - Modena
            and Ferrara city runs, day trips to Florence and Venice, or the
            Emilia-Romagna countryside.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Tell us where you want to go and how many are travelling, and
            we&apos;ll send you a clear, flat-rate quote - no meters, no
            surprises.
          </p>

          {showForm ? (
            <div className="mt-6">
              <TransportRequestForm propertySlug="the-nest-bologna" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-6 rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E]"
            >
              Request a Quote
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
