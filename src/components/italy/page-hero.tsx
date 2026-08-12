import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/italy/navbar";

type PageHeroProps = {
  title: string;
  backgroundImage: string;
  backgroundAlt?: string;
  homeHref?: string;
};

export default function PageHero({
  title,
  backgroundImage,
  backgroundAlt = "",
  homeHref = "/",
}: PageHeroProps) {
  return (
    <section className="relative flex h-[60vh] min-h-[480px] w-full items-center justify-center overflow-hidden bg-[#0B2B2B]">
      <Image
        src={backgroundImage}
        alt={backgroundAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/40" />

      <Navbar />

      <div className="relative z-10 flex flex-col items-center pt-16 text-center">
        <h1 className="text-4xl font-bold text-white drop-shadow-md sm:text-5xl">
          {title}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
          <Link href={homeHref} className="transition hover:text-white">
            Home
          </Link>
          <span className="text-white/50">—</span>
          <span>{title}</span>
        </div>
      </div>
    </section>
  );
}
