import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { CreateRoomInput, Property, Room, UpdateRoomInput } from "./types";

// Properties that use individually-bookable rooms (own price/capacity per
// room) instead of guests×rooms pricing tiers. Only Dona's Villa today.
// Add a slug here when another room-based property is added.
const ROOM_MODEL_SLUGS = new Set(["donas-villa"]);

// Whether a property prices/books via the room model (Rooms tab, per-room
// rates) rather than the tier model (Pricing tab, guests×rooms tiers).
// Can't be inferred purely from `rooms.length > 0` — a freshly-set-up
// room-based property legitimately has zero rooms until its first one is
// created, and that emptiness would otherwise be indistinguishable from a
// tier-based property. Every admin screen that needs to know which pricing
// model applies (villa detail tabs, Seasonal Pricing's room-vs-tier picker)
// should use this instead of checking `rooms.length` directly.
export function usesRoomModel(property: Pick<Property, "slug">, rooms: Room[]): boolean {
  return rooms.length > 0 || ROOM_MODEL_SLUGS.has(property.slug);
}

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES_SRI_LANKA_ROOMS.md.
// The public site normally gets rooms for free via `property.rooms` (see
// getPropertyBySlug) — this direct, authenticated endpoint is what every
// admin screen uses instead (Rooms tab, Blocks tab, Bookings tab), since it
// includes inactive rooms too and doesn't depend on `GET /api/properties`
// (the admin's property *list* endpoint) also embedding `rooms` — only the
// public single-property endpoint was asked to do that.
export function getRooms(fetcher: AuthedFetch, propertyId: string) {
  return fetcher<Room[]>(`/api/properties/${propertyId}/rooms?includeInactive=true`);
}

export function createRoom(fetcher: AuthedFetch, propertyId: string, input: CreateRoomInput) {
  return fetcher<Room>(`/api/properties/${propertyId}/rooms`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRoom(fetcher: AuthedFetch, roomId: string, input: UpdateRoomInput) {
  return fetcher<Room>(`/api/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRoom(fetcher: AuthedFetch, roomId: string) {
  return fetcher<void>(`/api/rooms/${roomId}`, { method: "DELETE" });
}
