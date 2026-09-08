import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { TransportRate, UpsertTransportRateInput } from "./types";

// Airport-transfer prices per party size for a property. Spec'd in
// BACKEND_CHANGES_VILLA_TRANSPORT.md — not in API_DOCUMENTATION.md yet, so
// every caller treats a 404 as "no transfers offered" rather than an error.

/** Public: guests need this to see the add-on price before booking. */
export function getTransportRates(propertyId: string) {
  return apiFetch<TransportRate[]>(`/api/properties/${propertyId}/transport-rates`);
}

/** Admin: replaces the whole 1-8 guest table in one call. */
export function updateTransportRates(
  fetcher: AuthedFetch,
  propertyId: string,
  rates: UpsertTransportRateInput[]
) {
  return fetcher<TransportRate[]>(`/api/admin/properties/${propertyId}/transport-rates`, {
    method: "PUT",
    body: JSON.stringify({ rates }),
  });
}
