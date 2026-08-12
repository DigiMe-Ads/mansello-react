import Image from "next/image";

const brands = [
  {
    src: "/images/sri-lanka/marketplace/brands/travelworld-logo.webp",
    alt: "travelWORLD",
    width: 110,
  },
  {
    src: "/images/sri-lanka/marketplace/brands/the-adventure-logo.webp",
    alt: "The Adventure",
    width: 92,
  },
  {
    src: "/images/sri-lanka/marketplace/brands/business-logo.webp",
    alt: "Business",
    width: 92,
  },
  {
    src: "/images/sri-lanka/marketplace/brands/roadtrip-adventure-travels-logo.webp",
    alt: "Roadtrip Adventure Travels",
    width: 118,
  },
  {
    src: "/images/sri-lanka/marketplace/brands/travelling-the-world-logo.webp",
    alt: "Travelling the World",
    width: 110,
  },
];

export default function BrandsTrust() {
  return (
    <section className="bg-white px-6 py-12 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl overflow-x-auto rounded-2xl border-2 border-dashed border-[#DCEEEA] p-6 sm:p-8">
        <div className="flex min-w-max items-center justify-between gap-6 lg:min-w-0">
          <div className="shrink-0">
            <p className="text-2xl font-bold text-[#F5A623] sm:text-3xl">1K+</p>
            <p className="text-xl font-bold text-[#153C4D] sm:text-2xl">
              Brands Trust Us
            </p>
          </div>

          {brands.map((brand) => (
            <div
              key={brand.alt}
              className="relative h-10 shrink-0 opacity-70 grayscale"
              style={{ width: brand.width }}
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                fill
                sizes={`${brand.width}px`}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
