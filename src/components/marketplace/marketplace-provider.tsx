"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCategories, getProducts } from "@/lib/api/marketplace";
import type { Category, Product } from "@/lib/api/types";

interface MarketplaceState {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
}

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

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
    () => ({ categories, products, loading, error, selectedCategorySlug, setSelectedCategorySlug }),
    [categories, products, loading, error, selectedCategorySlug]
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within a MarketplaceProvider");
  return ctx;
}
