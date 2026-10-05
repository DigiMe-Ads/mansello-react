"use client";

import Image from "next/image";
import { useMarketplace } from "@/components/marketplace/marketplace-provider";
import { useCart } from "@/components/marketplace/cart-provider";
import { StarRating, stockStatus } from "@/components/marketplace/product-detail-dialog";
import { categoryIdsForFilter, rootCategoryOf, subcategoriesOf, topLevelCategories } from "@/lib/category-tree";
import { formatMoney } from "@/lib/currency";
import { isRenderableImageSrc } from "@/lib/image";
import type { Product } from "@/lib/api/types";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { openProduct } = useMarketplace();
  const { stock, soldOut, low } = stockStatus(product);

  return (
    <div className="flex flex-col bg-slate-50">
      {/* Image + name open the detail dialog; Add to Cart stays a separate
          quick action so it doesn't also trigger the dialog. */}
      <button
        type="button"
        onClick={() => openProduct(product)}
        aria-label={`View details for ${product.name}`}
        className="group block text-left"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
          {isRenderableImageSrc(product.images[0]) && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          )}
          {soldOut && (
            <span className="absolute left-0 top-4 rounded-r-full bg-[#153C4D] px-3 py-1 text-xs font-medium text-white">
              Sold Out
            </span>
          )}
          {low && (
            <span className="absolute left-0 top-4 rounded-r-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Low stock — {stock} left
            </span>
          )}
        </div>
        <div className="px-3 pt-4 text-center">
          <h3 className="text-sm font-bold text-[#153C4D] group-hover:underline">{product.name}</h3>
          {(product.reviewCount ?? 0) > 0 && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-400">
              <StarRating value={product.averageRating ?? 0} size={12} />({product.reviewCount})
            </div>
          )}
          <p className="mt-1 text-sm text-slate-500">{formatMoney(product.priceUsd, "usd")}</p>
        </div>
      </button>
      <div className="mt-auto px-3 pb-4">
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

function CategoryChip({ active, onClick, children, small = false }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-semibold uppercase tracking-wide transition ${
        small ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
      } ${active ? "bg-[#153C4D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}

export default function BestProducts() {
  const { categories, products, loading, error, selectedCategorySlug, setSelectedCategorySlug } = useMarketplace();

  const filterIds = selectedCategorySlug ? categoryIdsForFilter(categories, selectedCategorySlug) : null;
  const visibleProducts = filterIds ? products.filter((p) => filterIds.has(p.categoryId)) : products;

  // Subcategory row shows for the selected top-level category — or, when a
  // subcategory itself is selected, for its parent, so it stays visible.
  const selected = categories.find((c) => c.slug === selectedCategorySlug);
  const activeRoot = selected ? rootCategoryOf(selected, categories) : null;
  const subcategories = activeRoot ? subcategoriesOf(categories, activeRoot.id) : [];

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
        <div className="mx-auto mt-8 max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2">
            <CategoryChip active={selectedCategorySlug === null} onClick={() => setSelectedCategorySlug(null)}>
              All
            </CategoryChip>
            {topLevelCategories(categories).map((c) => (
              <CategoryChip key={c.id} active={activeRoot?.id === c.id} onClick={() => setSelectedCategorySlug(c.slug)}>
                {c.name}
              </CategoryChip>
            ))}
          </div>

          {activeRoot && subcategories.length > 0 && (
            <div className="mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{activeRoot.name}:</span>
              <CategoryChip small active={selected?.id === activeRoot.id} onClick={() => setSelectedCategorySlug(activeRoot.slug)}>
                All {activeRoot.name}
              </CategoryChip>
              {subcategories.map((sub) => (
                <CategoryChip
                  key={sub.id}
                  small
                  active={selected?.id === sub.id}
                  onClick={() => setSelectedCategorySlug(sub.slug)}
                >
                  {sub.name}
                </CategoryChip>
              ))}
            </div>
          )}
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
