import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { CreateRoomInput, Room, UpdateRoomInput } from "./types";

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
