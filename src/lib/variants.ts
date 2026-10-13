import type { Product, ProductVariant, StockLevel } from "@/lib/api/types";

// Shared rules for products with optional variations (sizes etc.). A product
// with at least one active variant is sold per variant: price, stock, SKU and
// weight all come from the chosen variant.

export function activeVariants(product: Product): ProductVariant[] {
  return (product.variants ?? []).filter((v) => v.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function hasVariants(product: Product): boolean {
  return activeVariants(product).length > 0;
}

export function stockStatusOf(level: StockLevel | null | undefined): { stock: number; soldOut: boolean; low: boolean } {
  const stock = level?.quantityOnHand ?? 0;
  const threshold = level?.lowStockThreshold ?? 0;
  return { stock, soldOut: stock <= 0, low: stock > 0 && stock <= threshold };
}

/** Product-wide stock: a variant product is sold out only when every variant is. */
export function productStockStatus(product: Product): { stock: number; soldOut: boolean; low: boolean } {
  const variants = activeVariants(product);
  if (variants.length === 0) return stockStatusOf(product.stockLevel);
  const statuses = variants.map((v) => stockStatusOf(v.stockLevel));
  const stock = statuses.reduce((sum, s) => sum + s.stock, 0);
  const inStock = statuses.filter((s) => !s.soldOut);
  // "Low" on a card only when everything still for sale is low.
  return { stock, soldOut: inStock.length === 0, low: inStock.length > 0 && inStock.every((s) => s.low) };
}

/** Lowest and highest price across the variants (or the product price). */
export function priceRange(product: Product): { min: number; max: number } {
  const variants = activeVariants(product);
  if (variants.length === 0) {
    const p = Number(product.priceUsd);
    return { min: p, max: p };
  }
  const prices = variants.map((v) => Number(v.priceUsd));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Default selection in the product dialog: the first variant in stock. */
export function defaultVariant(product: Product): ProductVariant | null {
  const variants = activeVariants(product);
  return variants.find((v) => !stockStatusOf(v.stockLevel).soldOut) ?? variants[0] ?? null;
}
