import Link from "next/link";
import { Check } from "lucide-react";
import type { TourPackage } from "@/lib/tour-packages";

export function PackageDetail({ pkg }: { pkg: TourPackage }) {
  return (
    <div className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-4xl">
        {/* Summary */}
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F5A623]">{pkg.duration}</p>
        <h1 className="mt-1 text-3xl font-bold text-[#153C4D] sm:text-4xl">{pkg.title}</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{pkg.route}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{pkg.bestFor}</p>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {pkg.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8DC63F]" strokeWidth={2.5} />
              {h}
            </li>
          ))}
        </ul>

        <Link
          href={`/sri-lanka/transport?package=${encodeURIComponent(pkg.title)}#transfer-request`}
          className="mt-8 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E]"
        >
          Enquire About This Package
        </Link>

        {/* Itinerary */}
        <h2 className="mt-16 text-2xl font-bold text-[#153C4D] sm:text-3xl">Day-by-Day Itinerary</h2>
        <div className="mt-6 flex flex-col gap-6">
          {pkg.itinerary.map((d) => (
            <div key={d.day} className="rounded-3xl border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded-full bg-[#153C4D] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  {d.day}
                </span>
                <h3 className="font-bold text-[#153C4D]">{d.heading}</h3>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {d.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Complementary visits */}
        <h2 className="mt-16 text-2xl font-bold text-[#153C4D] sm:text-3xl">Complementary Visits</h2>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {pkg.complementaryVisits.map((v) => (
            <li key={v} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8DC63F]" strokeWidth={2.5} />
              {v}
            </li>
          ))}
        </ul>

        {/* Remarks */}
        <h2 className="mt-16 text-2xl font-bold text-[#153C4D] sm:text-3xl">Remarks</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {pkg.remarks.map((r, i) => (
            <li key={i} className="text-sm leading-relaxed text-slate-600">
              — {r}
            </li>
          ))}
        </ul>

        {/* Value added */}
        <h2 className="mt-10 text-2xl font-bold text-[#153C4D] sm:text-3xl">
          Value Added Services <span className="text-[#F5A623]">from Ceylon Experiences</span>
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {pkg.valueAdded.map((v) => (
            <li key={v} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8DC63F]" strokeWidth={2.5} />
              {v}
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-3xl bg-[#DCEEEA] px-6 py-10 text-center sm:px-10">
          <h3 className="text-xl font-bold text-[#153C4D] sm:text-2xl">Ready to plan this trip?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Send us your travel dates and group size, and we&apos;ll get back to you with a fixed quote.
          </p>
          <Link
            href={`/sri-lanka/transport?package=${encodeURIComponent(pkg.title)}#transfer-request`}
            className="mt-5 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E]"
          >
            Enquire About This Package
          </Link>
        </div>
      </div>
    </div>
  );
}
