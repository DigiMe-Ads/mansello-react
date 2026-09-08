import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Info } from "lucide-react";
import type { Destination } from "@/lib/destinations";

// Shared between the Italy and Sri Lanka destination pages. Each site's
// page supplies its own PageHero-equivalent (DestinationHero) around this;
// this component is everything below the hero.
export function DestinationDetail({
  destination,
  otherDestinations,
  destinationsBasePath,
  bookHref,
  bookLabel,
  transportHref,
}: {
  destination: Destination;
  // The rest of this site's destinations (current one already excluded by
  // the caller) — used for the "More Destinations" strip, so each of those
  // cards can show its own photo too, not a repeat of this page's hero.
  otherDestinations: Destination[];
  destinationsBasePath: string;
  bookHref: string;
  bookLabel: string;
  transportHref?: string;
}) {
  return (
    <>
      <div className="bg-white px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4">
            {destination.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {p}
              </p>
            ))}
          </div>

          {/* Don't Miss */}
          <h2 className="mt-14 text-2xl font-bold text-[#153C4D] sm:text-3xl">
            Don&apos;t Miss <span className="text-[#F5A623]">in {destination.name}</span>
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {destination.highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:-translate-y-0.5 hover:border-[#8DC63F] hover:shadow-md"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8DC63F]" strokeWidth={2.5} />
                {h}
              </li>
            ))}
          </ul>

          {/* Good to Know */}
          <h2 className="mt-14 text-2xl font-bold text-[#153C4D] sm:text-3xl">Good to Know</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {destination.goodToKnow.map((tip) => (
              <div
                key={tip}
                className="flex items-start gap-3 rounded-2xl bg-[#F7F5F0] px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#153C4D]" strokeWidth={1.75} />
                <p className="text-sm leading-relaxed text-slate-600">{tip}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-3xl bg-[#DCEEEA] px-6 py-10 text-center sm:px-10">
            <h3 className="text-xl font-bold text-[#153C4D] sm:text-2xl">
              Thinking about adding {destination.name} to your trip?
            </h3>
            <p className="mt-2 text-sm text-slate-600">{destination.tagline}.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={bookHref}
                className="inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E]"
              >
                {bookLabel}
              </Link>
              {transportHref && (
                <Link
                  href={transportHref}
                  className="inline-block rounded-full border border-[#153C4D]/30 px-8 py-3 text-sm font-semibold text-[#153C4D] transition hover:border-[#153C4D] hover:bg-white"
                >
                  Arrange Transport
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More Destinations */}
      {otherDestinations.length > 0 && (
        <div id="more-destinations" className="scroll-mt-24 bg-[#F7F5F0] px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-[#153C4D] sm:text-3xl">More Destinations</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherDestinations.map((d) => (
                <Link
                  key={d.slug}
                  href={`${destinationsBasePath}/${d.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden">
                    <Image
                      src={d.image}
                      alt={d.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-5 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{d.eyebrow}</p>
                      <p className="font-bold text-[#153C4D]">{d.name}</p>
                    </div>
                    <ArrowUpRight
                      className="h-5 w-5 shrink-0 text-[#8DC63F] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
