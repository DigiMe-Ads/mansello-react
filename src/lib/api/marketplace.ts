import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type {
  Category,
  CreateCategoryInput,
  CreateOrderInput,
  CreateProductInput,
  LowStockItem,
  Order,
  Product,
  UpdateProductInput,
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

export function getProducts(categorySlug?: string) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  return apiFetch<Product[]>(`/api/marketplace/catalog/products${query}`);
}

export function getProduct(id: string) {
  return apiFetch<Product>(`/api/marketplace/catalog/products/${id}`);
}

export function createOrder(input: CreateOrderInput) {
  return apiFetch<Order>("/api/marketplace/orders", {
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
