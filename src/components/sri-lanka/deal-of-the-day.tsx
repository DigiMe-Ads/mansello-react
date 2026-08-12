"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

const tents = [
  {
    src: "/images/italy/marketplace-italy/marketplace-italy-ragu-bolognese-jar.webp",
    alt: "Jar of Ragù alla Bolognese",
  },
  {
    src: "/images/italy/marketplace-italy/marketplace-italy-ragu-range.webp",
    alt: "Range of Barilla ragù jars",
  },
  {
    src: "/images/italy/marketplace-italy/marketplace-italy-pasta-plate-1.webp",
    alt: "Plate of rigatoni with ragù",
  },
  {
    src: "/images/italy/marketplace-italy/marketplace-italy-pasta-plate-2.webp",
    alt: "Plate of tagliatelle with ragù",
  },
];

export default function DealOfTheDay() {
  const [active, setActive] = useState(1);
  const [visible, setVisible] = useState(true);

  const selectTent = (index: number) => {
    if (index === active) return;
    setVisible(false);
    window.setTimeout(() => {
      setActive(index);
      setVisible(true);
    }, 180);
  };

  const goPrev = () => selectTent((active - 1 + tents.length) % tents.length);
  const goNext = () => selectTent((active + 1) % tents.length);

  return (
    <section className="relative overflow-hidden px-6 py-20 sm:px-12 lg:px-20">
      <Image
        src="/images/sri-lanka/marketplace/shops/shop-bg.webp"
        alt="Mountain road at dusk"
        fill
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="text-sm text-white/90">Shop With Us</p>
        <h2 className="mt-1 text-3xl font-extrabold uppercase tracking-wide text-[#F5A623] sm:text-4xl">
          Deal of the Day
        </h2>
        <div className="relative mx-auto mt-4 h-6 w-40">
          <Image
            src="/images/sri-lanka/marketplace/mountain.webp"
            alt=""
            fill
            sizes="160px"
            className="object-contain brightness-0 invert"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[72px_1fr_240px] lg:items-center">
          {/* Thumbnail rail */}
          <div className="mx-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous product"
              className="grid h-9 w-16 place-items-center rounded bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <ChevronUp size={18} />
            </button>

            <div className="flex flex-col gap-3">
              {tents.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectTent(i)}
                  aria-label={`Show ${t.alt}`}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    active === i
                      ? "border-slate-700"
                      : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <Image
                    src={t.src}
                    alt={t.alt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next product"
              className="grid h-9 w-16 place-items-center rounded bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Main image */}
          <div className="relative mx-auto h-64 w-full max-w-md sm:h-80">
            <Image
              src={tents[active].src}
              alt={tents[active].alt}
              fill
              sizes="(min-width: 768px) 448px, 100vw"
              className={`object-contain transition-all duration-300 ease-out ${
                visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            />
          </div>

          {/* Copy */}
          <div>
            <div className="relative h-6 w-11 overflow-hidden opacity-60">
              <Image
                src="/images/sri-lanka/marketplace/mountain.webp"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold uppercase tracking-wide text-[#153C4D]">
              Big Sale Today
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Get 30% off on your order above $200
            </p>
            <button
              type="button"
              className="mt-5 rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E]"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
