"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Compass, Landmark, Signpost, Waves } from "lucide-react";
import { TransportRequestForm } from "@/components/transport/transport-request-form";
import { tourPackages, type TourPackageIcon } from "@/lib/tour-packages";

const packageIcons: Record<TourPackageIcon, typeof Compass> = {
  compass: Compass,
  landmark: Landmark,
  palmtree: Waves,
};

const transfers = [
  {
    title: "Airport → Dona's Villa",
    description:
      "Meet & greet at arrivals, private air-conditioned vehicle, door-to-door drop-off",
  },
  {
    title: "Dona's Villa → Airport",
    description:
      "Scheduled pick-up from the villa with guaranteed on-time arrival for your flight",
  },
];

export default function FixedPriceTransfers() {
  const [showForm, setShowForm] = useState(false);
  const [initialNotes, setInitialNotes] = useState<string | undefined>(undefined);

  // A package detail page links here as `?package=<name>#transfer-request` —
  // pick that up so the form opens pre-filled instead of making the guest
  // retype which package they're asking about. Reading location.search can
  // only happen client-side, so this has to run in an effect.
  useEffect(() => {
    const packageName = new URLSearchParams(window.location.search).get("package");
    if (packageName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialNotes(`Interested in: ${packageName}`);
      setShowForm(true);
    }
  }, []);

  return (
    <section id="transfer-request" className="bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl items-start gap-16 lg:grid-cols-[440px_1fr]">
        {/* Left: photo */}
        <div className="relative mx-auto h-160 w-full max-w-120">
          <div className="absolute left-4 top-4 h-80 w-80 rounded-full bg-[#F9E3C6]/60" />

          <div className="relative h-full w-full">
            <Image
              src="/images/traveler.png"
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
            <span className="text-[#153C4D]">Airport</span>{" "}
            <span className="text-[#F5A623]">Transfers</span>
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Tell us how many passengers are travelling and we&apos;ll quote a fair price for the
            vehicle that fits your group — no surprises on the day.
          </p>

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
            <span className="text-[#F5A623]">Tour Packages</span>
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Going further than the airport?
          </p>

          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            We arrange private day trips and multi-day transport across Sri
            Lanka, adjusted to your itinerary and budget - Negombo and
            Colombo city runs, hill-country journeys to Kandy and Ella, the
            cultural triangle around Sigiriya, or the southern beaches of
            Galle and Mirissa.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Tell us where you want to go and how many are travelling, and
            we&apos;ll send you a clear quote for your group - no meters, no
            surprises.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {tourPackages.map((pkg) => {
              const Icon = packageIcons[pkg.icon];
              return (
                <Link
                  key={pkg.slug}
                  href={`/sri-lanka/transport/packages/${pkg.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 p-5 transition hover:border-[#8DC63F] hover:shadow-md"
                >
                  <Icon className="h-6 w-6 text-[#153C4D]" strokeWidth={1.5} />
                  <h3 className="mt-3 text-sm font-bold leading-snug text-[#153C4D]">{pkg.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{pkg.duration}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#F5A623] transition group-hover:text-[#d4900f]">
                    View Itinerary
                    <ArrowUpRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Fixed anchor for both states, so a link to #transfer-request-form
              (e.g. a package page's "Enquire About This Package" button)
              always lands here regardless of whether the form is showing yet. */}
          <div id="transfer-request-form" className="scroll-mt-24">
            {showForm ? (
              <div className="mt-6">
                <TransportRequestForm propertySlug="donas-villa" initialNotes={initialNotes} />
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
      </div>
    </section>
  );
}
