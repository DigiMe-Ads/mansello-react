"use client";

import Image from "next/image";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { isRenderableImageSrc } from "@/lib/image";

// Drives off the admin-picked "featured" categories (Category.featured, at
// most 4 — see BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md) instead of a
// hardcoded list. Reuses MarketplaceProvider's catalog fetch (this
// component now renders inside that provider, in
// pages/sri-lanka/marketplace/page.tsx) rather than fetching categories a
// second time. Clicking a card applies the same category filter the
// Best Products section's chips use and scrolls to it — the full
// marketplace listing/product logic itself is unchanged, still shows every
// category regardless of `featured`.
export default function MarketplaceCategories() {
  const { categories, loading, setSelectedCategorySlug } = useMarketplace();
  const featured = categories.filter((c) => c.featured).slice(0, 4);

  if (!loading && featured.length === 0) return null;

  function handleSelect(slug: string) {
    setSelectedCategorySlug(slug);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleSelect(c.slug)}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            {c.imageUrl && isRenderableImageSrc(c.imageUrl) && (
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 top-[30%] flex flex-col justify-center rounded-tl-3xl bg-black/55 px-5 py-5 transition group-hover:bg-black/65">
              <h3 className="text-lg font-bold leading-tight text-white">{c.name}</h3>
              {c.description && <p className="mt-2 text-sm leading-relaxed text-white/85">{c.description}</p>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
