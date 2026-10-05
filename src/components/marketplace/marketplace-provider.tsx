"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCategories, getProducts } from "@/lib/api/marketplace";
import type { Category, Product } from "@/lib/api/types";
import { ProductDetailDialog } from "@/components/marketplace/product-detail-dialog";

interface MarketplaceState {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  // Slug of either a top-level category or a subcategory; filtering by a
  // top-level one also matches its subcategories (lib/category-tree.ts).
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  // Product shown in the detail dialog, if any — opened from any section
  // (Best Products, Deal of the Day) and rendered once here.
  openProduct: (product: Product) => void;
}

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
        if (cancelled) return;
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load the marketplace");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<MarketplaceState>(
    () => ({
      categories,
      products,
      loading,
      error,
      selectedCategorySlug,
      setSelectedCategorySlug,
      openProduct: (product) => setViewingProductId(product.id),
    }),
    [categories, products, loading, error, selectedCategorySlug]
  );

  const viewingProduct = viewingProductId ? products.find((p) => p.id === viewingProductId) : undefined;

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
      {viewingProduct && (
        <ProductDetailDialog
          product={viewingProduct}
          categories={categories}
          onClose={() => setViewingProductId(null)}
          onReviewAdded={(rating) =>
            // Keep the card's rating summary in step without a refetch.
            setProducts((prev) =>
              prev.map((p) => {
                if (p.id !== viewingProduct.id) return p;
                const count = p.reviewCount ?? 0;
                const average = ((p.averageRating ?? 0) * count + rating) / (count + 1);
                return { ...p, reviewCount: count + 1, averageRating: average };
              })
            )
          }
        />
      )}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within a MarketplaceProvider");
  return ctx;
}
