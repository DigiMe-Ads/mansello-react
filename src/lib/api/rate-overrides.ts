import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { CreateRateOverrideInput, RateOverride, UpdateRateOverrideInput } from "./types";

// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md. Same CRUD shape as
// lib/api/offers.ts.

export function getRateOverrides(propertyId: string) {
  return apiFetch<RateOverride[]>(`/api/properties/${propertyId}/rate-overrides`);
}

export function createRateOverride(fetcher: AuthedFetch, propertyId: string, input: CreateRateOverrideInput) {
  return fetcher<RateOverride>(`/api/properties/${propertyId}/rate-overrides`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRateOverride(
  fetcher: AuthedFetch,
  propertyId: string,
  id: string,
  input: UpdateRateOverrideInput
) {
  return fetcher<RateOverride>(`/api/properties/${propertyId}/rate-overrides/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRateOverride(fetcher: AuthedFetch, propertyId: string, id: string) {
  return fetcher<void>(`/api/properties/${propertyId}/rate-overrides/${id}`, { method: "DELETE" });
}
