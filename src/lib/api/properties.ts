import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { Property, UpdatePricingTierInput, UpdatePropertyInput } from "./types";

export function getProperties() {
  return apiFetch<Property[]>("/api/properties");
}

// Admin: same list route, sent with the admin token. Public responses no
// longer include the iCal secrets (icalExportToken, airbnbIcalImportUrls,
// icalImportStatus); a scoped admin token gets them back. See
// BACKEND_CHANGES_SECURITY_AUDIT_FRONTEND.md (H1).
export function getPropertiesAdmin(fetcher: AuthedFetch) {
  return fetcher<Property[]>("/api/properties");
}

export function getPropertyBySlug(slug: string) {
  return apiFetch<Property>(`/api/properties/${slug}`);
}

export function updateProperty(fetcher: AuthedFetch, propertyId: string, input: UpdatePropertyInput) {
  return fetcher<Property>(`/api/properties/${propertyId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updatePricingTiers(fetcher: AuthedFetch, propertyId: string, tiers: UpdatePricingTierInput[]) {
  return fetcher<Property>(`/api/properties/${propertyId}/pricing-tiers`, {
    method: "PUT",
    body: JSON.stringify({ tiers }),
  });
}

export function deletePricingTier(fetcher: AuthedFetch, propertyId: string, tierId: string) {
  return fetcher<void>(`/api/properties/${propertyId}/pricing-tiers/${tierId}`, { method: "DELETE" });
}
