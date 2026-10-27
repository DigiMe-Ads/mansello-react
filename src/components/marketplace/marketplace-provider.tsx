"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCategories, getProducts } from "@/lib/api/marketplace";
import type { Category, Product } from "@/lib/api/types";
import { useNavigate } from "react-router-dom";

interface MarketplaceState {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  // Slug of either a top-level category or a subcategory; filtering by a
  // top-level one also matches its subcategories (lib/category-tree.ts).
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  // Opens the product's own page (/sri-lanka/marketplace/product/:id) —
  // from any section (Best Products, Deal of the Day).
  openProduct: (product: Product) => void;
}

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const navigate = useNavigate();

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
      openProduct: (product) => navigate(`/sri-lanka/marketplace/product/${product.id}`),
    }),
    [categories, products, loading, error, selectedCategorySlug, navigate]
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within a MarketplaceProvider");
  return ctx;
}
