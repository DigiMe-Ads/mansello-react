import { Plane } from "lucide-react";

export default function TransportIntro() {
  return (
    <section className="relative overflow-hidden bg-[#0E4A49] px-6 py-20 sm:px-12 lg:px-20">
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          <span className="text-[#F5A623]">Airport Transfers &amp;</span>{" "}
          <span className="text-white">Private Transport</span>
        </h2>

        {/* Faint decorative flight-path doodle */}
        <svg
          className="pointer-events-none absolute left-1/2 top-14 h-10 w-72 -translate-x-1/2 text-white opacity-10"
          viewBox="0 0 300 40"
          fill="none"
        >
          <path
            d="M10 25 Q 90 5, 160 20 T 290 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 5"
          />
          <circle cx="160" cy="20" r="2" fill="currentColor" />
          <circle cx="230" cy="14" r="2" fill="currentColor" />
        </svg>
        <Plane className="pointer-events-none absolute left-[42%] top-16 h-4 w-4 -rotate-12 text-white opacity-10" />

        <p className="relative mt-4 text-sm text-white/80 sm:text-base">
          Land softly. Leave on time.
        </p>

        <p className="mt-6 text-sm leading-relaxed text-white/90 sm:text-base">
          Skip the taxi queue and the price negotiations. Mansello&apos;s
          private transfer service takes you directly between Bologna
          Guglielmo Marconi Airport (BLQ) and The Nest Bologna at one flat
          rate — day or night, with a driver who knows exactly where
          you&apos;re going.
        </p>
      </div>
    </section>
  );
}
