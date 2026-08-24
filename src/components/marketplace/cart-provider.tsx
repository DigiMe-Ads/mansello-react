"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isRenderableImageSrc } from "@/lib/image";
import type { Product } from "@/lib/api/types";

export interface CartItem {
  productId: string;
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
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "mansello_sri_lanka_cart";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
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

  function addItem(product: Product, quantity = 1) {
    setItems((prev) => {
      const maxStock = product.stockLevel?.quantityOnHand ?? null;
      const existing = prev.find((i) => i.productId === product.id);

      if (existing) {
        const nextQuantity =
          maxStock != null ? Math.min(existing.quantity + quantity, maxStock) : existing.quantity + quantity;
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: nextQuantity } : i));
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          priceUsd: Number(product.priceUsd),
          image: isRenderableImageSrc(product.images[0]) ? product.images[0] : null,
          quantity: maxStock != null ? Math.min(quantity, maxStock) : quantity,
          maxStock,
          unitWeightKg: Number(product.weightKg ?? 0),
        },
      ];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: i.maxStock != null ? Math.min(quantity, i.maxStock) : quantity }
          : i
      );
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
