import Image from "next/image";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import Navbar from "@/components/italy/navbar";

export default function ItalyHero() {
  const { c } = useContent();

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0B2B2B]">
      {/* Background */}
      <Image
        src={c("italy.hero.backgroundImage")}
        alt="Entrance of The Nest Bologna"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      <Navbar />

      {/* Copy */}
      <div className="relative z-30 flex min-h-screen flex-col justify-start px-6 pt-24 sm:px-12 sm:pt-32 lg:px-20 lg:pt-40">
        <span className="italic text-white/90 text-lg sm:text-xl">{c("italy.hero.eyebrow")}</span>

        <div className="relative -mt-2 w-fit">
          <h1
            className="text-[5.5rem] leading-[0.9] text-white drop-shadow-lg sm:text-[7.5rem] lg:text-[10rem]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            {c("italy.hero.title")}
          </h1>

          {/* Butterfly, floating above the headline text */}
          <div className="absolute right-[6%] top-[-32%] z-40 h-16 w-16 sm:top-[-30%] sm:h-20 sm:w-20 lg:h-24 lg:w-24">
            <Image
              src="/images/butterfly.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 96px, (min-width: 640px) 80px, 64px"
              className="object-contain"
            />
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-base leading-relaxed text-white/90 sm:text-lg">{c("italy.hero.body")}</p>

        <Link
          href="/italy/airbnb"
          className="mx-auto mt-6 block w-fit rounded-full bg-[#8DC63F] px-10 py-4 text-base font-semibold text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E]"
        >
          {c("italy.hero.ctaLabel")}
        </Link>
      </div>
    </section>
  );
}
