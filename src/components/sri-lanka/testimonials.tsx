"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

// Real Airbnb reviews for Dona's Villa (Pamunugama, Sri Lanka).
const testimonials: Testimonial[] = [
  {
    name: "Anuke",
    role: "Airbnb Guest · 1 night",
    quote:
      "This was a serene stay in a beautiful villa all to ourselves. Nilanthi was always responsive. Her cousin, Samantha, is the caretaker and also an excellent chef — we ordered meals through her and they were excellent. The villa is a short walk to the beach where we swam and enjoyed the sunset.",
    rating: 5,
  },
  {
    name: "Sanowar",
    role: "Airbnb Guest · 10 nights",
    quote:
      "The house feels like home, really comfortable and calm. They have everything for your living. The host is really responsive and helpful — they even provided our extra needs as a complement. Highly recommended this house.",
    rating: 5,
  },
  {
    name: "Aleksandr",
    role: "Airbnb Guest · 3 nights",
    quote:
      "The villa is very spacious and has a private yard. A lot of beaches are nearby. The church is nearby. People are friendly. Peaceful and quiet place.",
    rating: 5,
  },
  {
    name: "Ritu",
    role: "Airbnb Guest · 2 nights",
    quote:
      "Quite a peaceful stay! N Akka helped with everything. Very comfortable for solo female travellers too. Beautiful home!",
    rating: 5,
  },
  {
    name: "Punith",
    role: "Airbnb Guest · 1 night",
    quote:
      "Very good, cosy stay if you're looking around the airport — very near to the beach and the village. Very accessible, with a good number of rooms, kitchen and bathroom. Thank you for hosting us, I would highly recommend this place.",
    rating: 5,
  },
  {
    name: "Naveen",
    role: "Airbnb Guest · 1 night",
    quote:
      "The place was very neat, clean, and well organized. Everything was as expected and absolutely worth the money. Would definitely recommend!",
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
