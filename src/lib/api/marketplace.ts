import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  Category,
  CreateCategoryInput,
  CreateOrderInput,
  CreateOrderResponse,
  CreateProductInput,
  CreateProductVariantInput,
  CreateProductReviewInput,
  LowStockItem,
  Order,
  Product,
  ProductOffer,
  ProductOfferInput,
  ProductReview,
  ProductVariant,
  StockLevel,
  StockRow,
  ShippingRate,
  UpdateCategoryInput,
  UpdateProductInput,
  UpdateProductVariantInput,
  UpsertShippingRateInput,
} from "./types";

export function getCategories() {
  return apiFetch<Category[]>("/api/marketplace/catalog/categories");
}

export function createCategory(fetcher: AuthedFetch, input: CreateCategoryInput) {
  return fetcher<Category>("/api/marketplace/catalog/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(fetcher: AuthedFetch, id: string, input: UpdateCategoryInput) {
  return fetcher<Category>(`/api/marketplace/catalog/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// 409 if the category still has products assigned — move or delete them first.
export function deleteCategory(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/marketplace/catalog/categories/${id}`, { method: "DELETE" });
}

export function getProducts(categorySlug?: string) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  return apiFetch<Product[]>(`/api/marketplace/catalog/products${query}`);
}

// Admin product list — sent with an admin token so it (once the backend
// branches on that, matching the existing GET /api/blog/posts pattern —
// see BACKEND_CHANGES_MARKETPLACE_ADMIN_PRODUCTS.md) includes inactive
// products too, not just the active ones the public storefront shows.
// Until that backend change ships this returns the same active-only list.
export function getProductsAdmin(fetcher: AuthedFetch, categorySlug?: string) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  return fetcher<Product[]>(`/api/marketplace/catalog/products${query}`);
}

export function getProduct(id: string) {
  return apiFetch<Product>(`/api/marketplace/catalog/products/${id}`);
}

// Public product reviews — newest first. Spec'd in
// BACKEND_CHANGES_PRODUCT_DETAILS_SUBCATEGORIES_ICAL.md; a 404 from a
// not-yet-updated backend is handled by the caller (reviews just hide).
export function getProductReviews(productId: string) {
  return apiFetch<ProductReview[]>(`/api/marketplace/catalog/products/${productId}/reviews`);
}

export function createProductReview(productId: string, input: CreateProductReviewInput) {
  return apiFetch<ProductReview>(`/api/marketplace/catalog/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Admin moderation — super_admin / marketplace_manager only.
export function deleteProductReview(fetcher: AuthedFetch, reviewId: string) {
  return fetcher<void>(`/api/marketplace/catalog/reviews/${reviewId}`, { method: "DELETE" });
}

// Returns the created (pending-payment) order alongside a Stripe
// clientSecret — mirrors createBooking. The checkout page shows a payment
// form with this before the order is actually confirmed; see
// BACKEND_CHANGES_MARKETPLACE_PAYMENTS.md.
export function createOrder(input: CreateOrderInput) {
  return apiFetch<CreateOrderResponse>("/api/marketplace/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/api/marketplace/orders/${id}`);
}

// --- Admin ---

export function uploadProductImages(fetcher: AuthedFetch, files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  return fetcher<{ urls: string[] }>("/api/marketplace/catalog/products/images", {
    method: "POST",
    body: formData,
  });
}

export function createProduct(fetcher: AuthedFetch, input: CreateProductInput) {
  return fetcher<Product>("/api/marketplace/catalog/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(fetcher: AuthedFetch, id: string, input: UpdateProductInput) {
  return fetcher<Product>(`/api/marketplace/catalog/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Allowed even with order history: past orders keep their own snapshot of
// the name, option, SKU and price.
export function deleteProduct(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/marketplace/catalog/products/${id}`, { method: "DELETE" });
}

export function adjustStock(fetcher: AuthedFetch, productId: string, delta: number) {
  return fetcher<Product>(`/api/marketplace/catalog/products/${productId}/stock-adjustment`, {
    method: "POST",
    body: JSON.stringify({ delta }),
  });
}

// --- Product variations (admin) ---

export function createProductVariant(fetcher: AuthedFetch, productId: string, input: CreateProductVariantInput) {
  return fetcher<ProductVariant>(`/api/marketplace/catalog/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProductVariant(
  fetcher: AuthedFetch,
  productId: string,
  variantId: string,
  input: UpdateProductVariantInput
) {
  return fetcher<ProductVariant>(`/api/marketplace/catalog/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Allowed even with order history (orders keep their snapshots).
export function deleteProductVariant(fetcher: AuthedFetch, productId: string, variantId: string) {
  return fetcher<void>(`/api/marketplace/catalog/products/${productId}/variants/${variantId}`, { method: "DELETE" });
}

export function adjustVariantStock(fetcher: AuthedFetch, productId: string, variantId: string, delta: number) {
  return fetcher<ProductVariant>(
    `/api/marketplace/catalog/products/${productId}/variants/${variantId}/stock-adjustment`,
    { method: "POST", body: JSON.stringify({ delta }) }
  );
}

export function listLowStock(fetcher: AuthedFetch) {
  return fetcher<LowStockItem[]>("/api/marketplace/catalog/low-stock");
}

// --- Stock tab (admin) ---

export function listStock(fetcher: AuthedFetch) {
  return fetcher<StockRow[]>("/api/marketplace/catalog/stock");
}

/** Sets the counted quantity and/or the low-stock alert level directly. */
export function setStockLevel(
  fetcher: AuthedFetch,
  stockLevelId: string,
  input: { quantityOnHand?: number; lowStockThreshold?: number }
) {
  return fetcher<StockLevel>(`/api/marketplace/catalog/stock/${stockLevelId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// --- Product offers (admin) ---

export function listProductOffers(fetcher: AuthedFetch) {
  return fetcher<ProductOffer[]>("/api/marketplace/catalog/offers");
}

export function createProductOffer(fetcher: AuthedFetch, productId: string, input: ProductOfferInput) {
  return fetcher<ProductOffer>(`/api/marketplace/catalog/products/${productId}/offers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProductOffer(fetcher: AuthedFetch, offerId: string, input: Partial<ProductOfferInput>) {
  return fetcher<ProductOffer>(`/api/marketplace/catalog/offers/${offerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProductOffer(fetcher: AuthedFetch, offerId: string) {
  return fetcher<void>(`/api/marketplace/catalog/offers/${offerId}`, { method: "DELETE" });
}

export function listOrders(fetcher: AuthedFetch, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetcher<Order[]>(`/api/marketplace/orders${query}`);
}

export function updateOrderStatus(fetcher: AuthedFetch, id: string, status: string) {
  return fetcher<Order>(`/api/marketplace/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Shipping rates (weight-based delivery fee) — not in
// API_DOCUMENTATION.md yet, spec'd in
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md. Public GET so checkout can
// price shipping before the customer has an admin session.

export function getShippingRates() {
  return apiFetch<ShippingRate[]>("/api/marketplace/shipping-rates");
}

// Bulk replace, same pattern as updatePricingTiers.
export function updateShippingRates(fetcher: AuthedFetch, rates: UpsertShippingRateInput[]) {
  return fetcher<ShippingRate[]>("/api/marketplace/shipping-rates", {
    method: "PUT",
    body: JSON.stringify({ rates }),
  });
}
