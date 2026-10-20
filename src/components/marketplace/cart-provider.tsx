"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isRenderableImageSrc } from "@/lib/image";
import type { Product, ProductVariant } from "@/lib/api/types";
import { effectivePrice } from "@/lib/variants";

export interface CartItem {
  // Identifies the cart line: one line per product, or per product +
  // variation, so "Cream 80ml" and "Cream 100ml" are separate lines.
  key: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  name: string;
  priceUsd: number;
  image: string | null;
  quantity: number;
  maxStock: number | null;
  // kg per single unit — drives the weight-based shipping fee at checkout.
  // 0 for products created before this field existed.
  unitWeightKg: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalWeightKg: number;
  // Pass the chosen variant for a product that has variations.
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

// Mirrors the backend's order validation (integer quantity 1-99 per line).
export const MAX_CART_QUANTITY = 99;

function clampQuantity(quantity: number, maxStock: number | null): number {
  const limit = Math.min(MAX_CART_QUANTITY, maxStock ?? MAX_CART_QUANTITY);
  return Math.max(0, Math.min(Math.floor(quantity), limit));
}

export function cartLineKey(productId: string, variantId: string | null | undefined): string {
  return `${productId}:${variantId ?? ""}`;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "mansello_sri_lanka_cart";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // Carts saved before variations existed have no key/variant fields.
    return (JSON.parse(raw) as Partial<CartItem>[]).map((i) => ({
      ...(i as CartItem),
      variantId: i.variantId ?? null,
      variantName: i.variantName ?? null,
      key: i.key ?? cartLineKey(i.productId!, i.variantId),
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so the cart must start empty
    // on the server and sync in after mount — reading it eagerly via a lazy
    // useState initializer would desync from the server-rendered markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(product: Product, quantity = 1, variant: ProductVariant | null = null) {
    setItems((prev) => {
      const source = variant ?? product;
      const maxStock = source.stockLevel?.quantityOnHand ?? null;
      const key = cartLineKey(product.id, variant?.id);
      const existing = prev.find((i) => i.key === key);

      if (existing) {
        const nextQuantity = clampQuantity(existing.quantity + quantity, maxStock);
        return prev.map((i) => (i.key === key ? { ...i, quantity: nextQuantity, maxStock } : i));
      }

      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          name: product.name,
          // The offer price, if one is running — checkout re-prices on the server.
          priceUsd: effectivePrice(source),
          image: [...(variant?.images ?? []), ...product.images].find((src) => isRenderableImageSrc(src)) ?? null,
          quantity: clampQuantity(quantity, maxStock),
          maxStock,
          unitWeightKg: Number(source.weightKg ?? 0),
        },
      ];
    });
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function setQuantity(key: string, quantity: number) {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) => (i.key === key ? { ...i, quantity: clampQuantity(quantity, i.maxStock) } : i));
    });
  }

  function clear() {
    setItems([]);
  }

  const value = useMemo<CartState>(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.priceUsd * i.quantity, 0);
    const totalWeightKg = items.reduce((sum, i) => sum + i.unitWeightKg * i.quantity, 0);
    return { items, itemCount, subtotal, totalWeightKg, addItem, removeItem, setQuantity, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
