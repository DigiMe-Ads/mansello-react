import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Destination } from "@/lib/destinations";

// Unlike the generic PageHero (a fixed background shared by every page that
// uses it), this hero is built around the destination's own photo — the
// whole point being that Kandy looks like Kandy and Modena looks like
// Modena, not the same stock hero image with a different title on top.
// `navbar` is passed in rather than imported here so this one component
// works for both sites (Italy and Sri Lanka each have their own Navbar).
export function DestinationHero({
  destination,
  navbar,
  homeHref,
}: {
  destination: Destination;
  navbar: ReactNode;
  homeHref: string;
}) {
  return (
    <section className="relative flex h-[70vh] min-h-[560px] w-full items-end overflow-hidden bg-[#0B2B2B]">
      <Image
        src={destination.image}
        alt={destination.name}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Heavier at the bottom, where the title sits, lighter toward the
          top so the photo itself still reads as the subject. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/40" />

      {navbar}

      <div className="relative z-10 w-full px-6 pb-14 sm:px-12 lg:px-20">
        <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
          <Link href={homeHref} className="transition hover:text-white">
            Home
          </Link>
          <span className="text-white/40">—</span>
          <span>Destinations</span>
          <span className="text-white/40">—</span>
          <span className="text-white">{destination.name}</span>
        </div>

        <span className="mt-5 block italic text-white/90">{destination.eyebrow}</span>
        <h1
          className="-mt-1 text-6xl leading-[0.95] text-white drop-shadow-lg sm:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-script)" }}
        >
          {destination.name}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#153C4D] shadow-lg">
            {destination.tagline}
          </span>
          {/* Plain in-page anchor (not a route Link) — jumps down to the
              "More Destinations" strip at the bottom of this same page. */}
          <a
            href="#more-destinations"
            className="inline-flex w-fit items-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
          >
            More Destinations ↓
          </a>
        </div>
      </div>
    </section>
  );
}
