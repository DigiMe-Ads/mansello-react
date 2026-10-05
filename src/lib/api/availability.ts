import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { AvailabilityBlock, CreateManualBlockInput } from "./types";

// Public: the booking calendar only needs { startDate, endDate, status }
// (and optionally roomId/source) — the backend strips everything else
// (bookingId, externalUid, ...) from unauthenticated responses. See
// BACKEND_CHANGES_SECURITY_AUDIT_FRONTEND.md (C2).
export function getAvailability(propertyId: string, from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return apiFetch<AvailabilityBlock[]>(`/api/availability/${propertyId}?${params.toString()}`);
}

// Admin: same route, sent with the admin token so the full rows (id,
// source, roomId, bookingId, ...) come back — the Calendar & Blocks tab
// needs `id` to release a block and `source`/`roomId` to label it.
export function getAvailabilityAdmin(fetcher: AuthedFetch, propertyId: string, from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return fetcher<AvailabilityBlock[]>(`/api/availability/${propertyId}?${params.toString()}`);
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
