import type { OfferPriceFields, Product, ProductVariant, StockLevel } from "@/lib/api/types";

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

/** What a product/variation sells for right now: the offer price if one is running. */
export function effectivePrice(item: { priceUsd: string } & OfferPriceFields): number {
  return item.salePriceUsd != null ? Number(item.salePriceUsd) : Number(item.priceUsd);
}

/** The best running offer across the product and its options, if any. */
export function bestOfferOf(product: Product): (OfferPriceFields & { offerPercent: number }) | null {
  const candidates: OfferPriceFields[] = [product, ...activeVariants(product)];
  let best: (OfferPriceFields & { offerPercent: number }) | null = null;
  for (const c of candidates) {
    if (c.offerPercent != null && (!best || c.offerPercent > best.offerPercent)) {
      best = c as OfferPriceFields & { offerPercent: number };
    }
  }
  return best;
}

/**
 * Lowest and highest price across the variants (or the product price), as
 * charged now; `listMin` is the lowest price before any offer.
 */
export function priceRange(product: Product): { min: number; max: number; listMin: number } {
  const variants = activeVariants(product);
  if (variants.length === 0) {
    const p = effectivePrice(product);
    return { min: p, max: p, listMin: Number(product.priceUsd) };
  }
  const prices = variants.map(effectivePrice);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    listMin: Math.min(...variants.map((v) => Number(v.priceUsd))),
  };
}

/** "Get it between Thu 23 Oct – Sat 25 Oct", or null when not shown for this product. */
export function deliveryEstimate(product: Product, from = new Date()): string | null {
  const { deliveryEstimateEnabled, deliveryMinDays, deliveryMaxDays } = product;
  if (!deliveryEstimateEnabled || deliveryMinDays == null || deliveryMaxDays == null) return null;
  const fmt = (days: number) => {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };
  if (deliveryMaxDays === 0) return "Get it today";
  if (deliveryMinDays === deliveryMaxDays) return `Get it by ${fmt(deliveryMaxDays)}`;
  return `Get it between ${fmt(deliveryMinDays)} – ${fmt(deliveryMaxDays)}`;
}

/** Default selection in the product dialog: the first variant in stock. */
export function defaultVariant(product: Product): ProductVariant | null {
  const variants = activeVariants(product);
  return variants.find((v) => !stockStatusOf(v.stockLevel).soldOut) ?? variants[0] ?? null;
}
