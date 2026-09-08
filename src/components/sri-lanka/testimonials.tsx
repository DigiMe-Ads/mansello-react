"use client";

import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { getTestimonials } from "@/lib/api/testimonials";
import type { Testimonial } from "@/lib/api/types";

// Reads exclusively from the database now — no hardcoded fallback. If
// nothing's been added yet in the admin Testimonials tab (or its "Seed
// Existing Reviews" button hasn't been run), this section simply doesn't
// render rather than showing stale or placeholder content. See
// BACKEND_CHANGES_TESTIMONIALS.md.
export default function Testimonials() {
  // `null` = still loading (render nothing rather than flash an empty
  // state); `[]` = loaded, genuinely no active testimonials for this site.
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    getTestimonials("sri_lanka")
      .then((result) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTestimonials(result);
      })
      .catch(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTestimonials([]);
      });
  }, []);

  if (!testimonials || testimonials.length === 0) return null;

  const current = testimonials[active];

  const goPrev = () =>
    setActive((i) => (i - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setActive((i) => (i + 1) % testimonials.length);

  return (
    <section className="relative overflow-hidden bg-white px-6 pb-24 pt-20 sm:px-12 lg:px-20">
      {/* Heading */}
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          <span className="text-[#1B4B4F]">Our Client</span>{" "}
          <span className="text-[#F5A623]">Says!</span>
        </h2>
        <p className="mt-2 text-sm text-[#1B4B4F]/70 sm:text-base">
          Real reviews from real guests who&apos;ve stayed at Dona&apos;s Villa
        </p>
      </div>

      {/* Testimonial card */}
      <div className="relative mx-auto mt-14 max-w-3xl">
        <div className="relative rounded-4xl bg-[#F7F5F0] px-8 py-10 shadow-sm sm:px-12 sm:py-14">
          <Quote
            className="mx-auto h-10 w-10 text-[#8DC63F]"
            strokeWidth={1.5}
            fill="currentColor"
          />

          <p className="mt-6 text-center text-lg leading-relaxed text-slate-600 sm:text-xl">
            &ldquo;{current.quote}&rdquo;
          </p>

          <div className="mt-6 flex items-center justify-center gap-1 text-[#F5A623]">
            {Array.from({ length: current.rating }).map((_, i) => (
              <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
            ))}
          </div>

          <div className="mt-4 text-center">
            <p
              className="text-2xl text-[#1B4B4F]"
              style={{ fontFamily: "var(--font-script)" }}
            >
              {current.name}
            </p>
            <p className="text-sm font-semibold text-[#F5A623]">{current.role}</p>
          </div>
        </div>

        {/* Navigation: prev/next + position dots */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#8DC63F] text-white shadow-md transition hover:bg-[#72A62E]"
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show testimonial from ${t.name}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === active ? "w-6 bg-[#1B4B4F]" : "w-2.5 bg-[#1B4B4F]/25 hover:bg-[#1B4B4F]/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonial"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#8DC63F] text-white shadow-md transition hover:bg-[#72A62E]"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
