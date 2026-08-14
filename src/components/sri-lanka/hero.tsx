import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";

export default function SriLankaHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0B2B2B]">
      {/* Background */}
      <Image
        src="/images/bg.webp"
        alt="Aerial view of a Sri Lankan coastline with palm trees"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <Navbar />

      {/* Copy */}
      <div className="relative z-30 flex min-h-screen flex-col justify-start px-6 pt-40 sm:px-12 sm:pt-48 lg:px-20 lg:pt-56">
        <span className="italic text-white/90 text-lg sm:text-xl">Explore</span>

        <div className="relative -mt-2 w-fit">
          <h1
            className="text-[5.5rem] leading-[0.9] text-white drop-shadow-lg sm:text-[7.5rem] lg:text-[10rem]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Sri Lanka
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

        <p className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-white/90 sm:text-lg">
          Stay at Dona&apos;s Villa — your peaceful coastal retreat just 30 
          minutes from Colombo Airport. Comfortable rooms, home-cooked warmth, 
          and reliable airport transfers, all in one place.
        </p>

        <Link
          href="/sri-lanka/airbnb"
          className="mx-auto mt-6 block w-fit rounded-full bg-[#8DC63F] px-10 py-4 text-base font-semibold text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E]"
        >
          Book Your Stay
        </Link>
      </div>

      {/* Rock, behind the lizard */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-45 w-52.5 sm:h-60 sm:w-70 lg:h-75 lg:w-87.5">
        <Image
          src="/images/rock.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 350px, (min-width: 640px) 280px, 210px"
          className="object-contain object-bottom"
        />
      </div>

      {/* Lizard, in front of the rock */}
      <div className="pointer-events-none absolute bottom-4 left-0 z-20 h-32.5 w-40 sm:h-45 sm:w-52.5 lg:h-55 lg:w-65">
        <Image
          src="/images/lizard.webp"
          alt="Chameleon"
          fill
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 210px, 160px"
          className="object-contain object-bottom"
        />
      </div>
    </section>
  );
}