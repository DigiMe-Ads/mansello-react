import Image from "next/image";
import Navbar from "@/components/navbar";

export default function MarketplaceHero() {
  return (
    <section className="relative flex aspect-1500/787 w-full items-center overflow-hidden bg-[#0B2B2B]">
      <Image
        src="/images/sri-lanka/marketplace/marketplace-hero.webp"
        alt="Hikers looking out over the misty hills of Sri Lanka"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <Navbar />

      <div className="relative z-10 w-full px-6 pb-16 sm:px-12 lg:px-20">
        <div className="max-w-md sm:ml-[44%] lg:ml-[54%]">
          <h1 className="text-2xl text-slate-900 sm:text-3xl">The Mansello</h1>
          <h2 className="text-4xl font-extrabold leading-[0.95] text-[#6FAE43] sm:text-5xl lg:text-6xl">
            Marketplace
          </h2>

          <p className="mt-4 text-sm font-medium text-slate-800">
            A taste of Italy, delivered in Sri Lanka.
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-700 sm:text-sm">
            Living between two countries taught us how much of Italy people
            fall in love with - and how hard it is to find the real thing
            back home. The Mansello Marketplace brings genuine Italian
            products to Sri Lanka, sourced directly through our home in
            Bologna, the food capital of Italy.
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-700 sm:text-sm">
            Every item is authentic, carefully selected, and shipped with the
            same care we put into hosting our guests.
          </p>
        </div>
      </div>
    </section>
  );
}
