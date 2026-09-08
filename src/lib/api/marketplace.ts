import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  Category,
  CreateCategoryInput,
  CreateOrderInput,
  CreateOrderResponse,
  CreateProductInput,
  LowStockItem,
  Order,
  Product,
  ShippingRate,
  UpdateCategoryInput,
  UpdateProductInput,
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

// 409 if the product has order history — deactivate it instead (PATCH active: false).
export function deleteProduct(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/marketplace/catalog/products/${id}`, { method: "DELETE" });
}

export function adjustStock(fetcher: AuthedFetch, productId: string, delta: number) {
  return fetcher<Product>(`/api/marketplace/catalog/products/${productId}/stock-adjustment`, {
    method: "POST",
    body: JSON.stringify({ delta }),
  });
}

export function listLowStock(fetcher: AuthedFetch) {
  return fetcher<LowStockItem[]>("/api/marketplace/catalog/low-stock");
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
