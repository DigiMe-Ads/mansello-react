import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { AvailabilityBlock, CreateManualBlockInput } from "./types";

export function getAvailability(propertyId: string, from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return apiFetch<AvailabilityBlock[]>(`/api/availability/${propertyId}?${params.toString()}`);
}

export function createManualBlock(fetcher: AuthedFetch, propertyId: string, input: CreateManualBlockInput) {
  return fetcher<AvailabilityBlock>(`/api/availability/${propertyId}/blocks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function releaseBlock(fetcher: AuthedFetch, blockId: string) {
  return fetcher<AvailabilityBlock>(`/api/availability/blocks/${blockId}`, { method: "DELETE" });
}
