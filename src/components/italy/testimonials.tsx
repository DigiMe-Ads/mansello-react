"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

// Real guest reviews for The Nest Bologna (Airbnb + Booking.com).
const testimonials: Testimonial[] = [
  {
    name: "Sanjay",
    role: "Booking.com Guest, Germany",
    quote:
      "I would recommend this place to everyone, especially those coming to attend fairs, due to proximity. The property had everything one can expect and more — a large approx. 60″ TV, a fully functional kitchen with cutlery, two ACs, easy-to-connect WiFi, and a bath tub in addition to a shower. It made my stay comfortable for a very decent price. I would definitely book this again!",
    rating: 5,
  },
  {
    name: "Gaia",
    role: "Airbnb Guest · 1 night",
    quote:
      "I stayed at this accommodation for one night and was extremely satisfied. The house was cosy, clean and equipped with everything you need for a comfortable stay. The hosts were always kind and helpful.",
    rating: 5,
  },
  {
    name: "Kelaure Breldy Pavel",
    role: "Airbnb Guest · 1 night",
    quote:
      "Beautiful apartment in a quiet area, equipped with everything you need. Exactly as described. Don and his parents were very welcoming and kind. Good value for money. It was like being at home. Highly recommended.",
    rating: 5,
  },
  {
    name: "Mylie",
    role: "Airbnb Guest · 1 night",
    quote: "Super big nice place with air con and all you need.",
    rating: 5,
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
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
          Real reviews from real guests who&apos;ve stayed at The Nest Bologna
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
                key={t.name}
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
