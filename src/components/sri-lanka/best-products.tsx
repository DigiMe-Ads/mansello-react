"use client";

import Image from "next/image";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { useCart } from "@/components/marketplace/cart-provider";
import { formatMoney } from "@/lib/currency";
import { isRenderableImageSrc } from "@/lib/image";
import type { Product } from "@/lib/api/types";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const stock = product.stockLevel?.quantityOnHand ?? 0;
  const soldOut = stock <= 0;

  return (
    <div className="bg-slate-50">
      <div className="relative aspect-[4/5] w-full bg-slate-100">
        {isRenderableImageSrc(product.images[0]) && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover"
          />
        )}
        {soldOut && (
          <span className="absolute left-0 top-4 rounded-r-full bg-[#153C4D] px-3 py-1 text-xs font-medium text-white">
            Sold Out
          </span>
        )}
      </div>
      <div className="px-3 py-4 text-center">
        <h3 className="text-sm font-bold text-[#153C4D]">{product.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{formatMoney(product.priceUsd, "usd")}</p>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => addItem(product)}
          className="mt-3 w-full rounded-full bg-[#8DC63F] py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#72A62E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function BestProducts() {
  const { categories, products, loading, error, selectedCategorySlug, setSelectedCategorySlug } = useMarketplace();

  const visibleProducts = selectedCategorySlug
    ? products.filter((p) => p.category.slug === selectedCategorySlug)
    : products;

  return (
    <section id="products" className="scroll-mt-28 bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-sm text-slate-500">Featured</p>
        <h2 className="mt-1 text-2xl font-extrabold uppercase tracking-wide text-[#153C4D] sm:text-3xl">
          Best Products
        </h2>
        <div className="relative mx-auto mt-4 h-6 w-40">
          <Image
            src="/images/sri-lanka/marketplace/mountain.webp"
            alt=""
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategorySlug(null)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              selectedCategorySlug === null ? "bg-[#153C4D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategorySlug(c.slug)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                selectedCategorySlug === c.slug ? "bg-[#153C4D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="mt-10 text-center text-sm text-slate-400">Loading products...</p>}
      {error && <p className="mt-10 text-center text-sm text-red-600">{error}</p>}
      {!loading && !error && visibleProducts.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">No products available yet — check back soon.</p>
      )}

      {!loading && !error && visibleProducts.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
