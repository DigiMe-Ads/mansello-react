import Image from "next/image";
import Link from "next/link";

export default function Adventure() {
  return (
    <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden bg-[#1F3D2E]">
      <Image
        src="/images/hero-bg.webp"
        alt="Sunlight streaming through a cave"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/30" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative mb-2 h-[200px] w-[200px] rounded-full bg-white shadow-xl">
          <Image
            src="/images/logo.webp"
            alt="Mansello"
            fill
            sizes="200px"
            className="object-contain p-4"
          />
        </div>

        <h2
          className="text-6xl text-white drop-shadow-lg sm:text-7xl md:text-8xl"
          style={{ fontFamily: "var(--font-script)" }}
        >
          Adventure
        </h2>

        <p className="mt-2 text-xl font-semibold uppercase tracking-[0.15em] text-white drop-shadow-md sm:text-2xl">
          It&apos;s Time To Travel
        </p>

        <Link
          href="/italy/airbnb"
          className="mt-8 rounded-full bg-gradient-to-b from-[#8DC63F] to-[#6FA82E] px-10 py-4 text-base font-semibold text-[#1F3D2E] shadow-lg transition hover:from-[#7FB935] hover:to-[#5F9526]"
        >
          Book Now
        </Link>
      </div>
    </section>
  );
}
