import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { CreateOfferInput, Offer, UpdateOfferInput } from "./types";

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES.md.

export function getOffers(propertyId: string) {
  return apiFetch<Offer[]>(`/api/offers?propertyId=${encodeURIComponent(propertyId)}`);
}

export async function getActiveOffer(propertyId: string): Promise<Offer | null> {
  const offers = await getOffers(propertyId);
  return offers.find((o) => o.active) ?? null;
}

export function createOffer(fetcher: AuthedFetch, input: CreateOfferInput) {
  return fetcher<Offer>("/api/offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOffer(fetcher: AuthedFetch, id: string, input: UpdateOfferInput) {
  return fetcher<Offer>(`/api/offers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteOffer(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/offers/${id}`, { method: "DELETE" });
}
