import type { AvailabilityBlock } from "./api/types";
import { addDaysToKey } from "./date";

// Expands every active [startDate, endDate) block into individual day-keys
// for O(1) lookups while rendering the calendar.
//
// Pass `roomId` to get just that room's blocked dates (a block with no
// roomId of its own — a whole-property block, e.g. an iCal import or a
// manual maintenance block — still applies to every room). Omit it to get
// every block regardless of which room it's on, which is what the
// single-unit properties (no rooms at all) and the admin's whole-property
// blocks list both want.
export function buildBlockedDateSet(blocks: AvailabilityBlock[], roomId?: string): Set<string> {
  const set = new Set<string>();
  for (const block of blocks) {
    if (block.status !== "active") continue;
    if (roomId !== undefined && block.roomId && block.roomId !== roomId) continue;
    let cursor = block.startDate.slice(0, 10);
    const end = block.endDate.slice(0, 10);
    while (cursor < end) {
      set.add(cursor);
      cursor = addDaysToKey(cursor, 1);
    }
  }
  return set;
}

// For a property with individually-bookable rooms: booking ANY one room
// locks the WHOLE villa for those dates — only one party occupies the villa
// at a time, so a block on any room (or the whole property) blocks every
// room. This intentionally does *not* intersect per-room sets (a property
// with rooms used to allow independent per-room availability; that's been
// superseded — see BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md). Falls
// back to buildBlockedDateSet's plain whole-property behavior when the
// property has no rooms at all, which is the same thing either way.
export function buildBlockedDateSetForRooms(blocks: AvailabilityBlock[], _roomIds: string[]): Set<string> {
  return buildBlockedDateSet(blocks);
}

export function isRangeAvailable(blocked: Set<string>, checkIn: string, checkOut: string): boolean {
  let cursor = checkIn;
  while (cursor < checkOut) {
    if (blocked.has(cursor)) return false;
    cursor = addDaysToKey(cursor, 1);
  }
  return true;
}
