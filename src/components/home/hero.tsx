import Image from "next/image";
import Link from "next/link";

const destinations = [
  { label: "Italy", href: "/italy" },
  { label: "Sri Lanka", href: "/sri-lanka" },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#1F3D2E]">
      <Image
        src="/images/hero-bg.webp"
        alt="Sunlight streaming through a cave"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* White circular backdrop stays CSS, the mark itself is your image */}
        <div className="relative mb-6 h-[200px] w-[200px] rounded-full bg-white shadow-xl sm:h-[200px] sm:w-[200px]">
          <Image
            src="/images/logo.webp"
            alt="Mansello"
            fill
            sizes="200px"
            className="object-contain p-4"
          />
        </div>

        <h1
          className="text-5xl text-white drop-shadow-md sm:text-6xl md:text-7xl"
          style={{ fontFamily: "var(--font-script)" }}
        >
          Your Home Away From Home
        </h1>

        <p className="mt-6 max-w-xl text-sm uppercase tracking-[0.2em] text-white/90 sm:text-base">
          Two countries. One warm welcome. Choose your destination to begin.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {destinations.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="rounded-full bg-[#8DC63F] px-10 py-3 text-sm font-semibold uppercase tracking-wide text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E]"
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}