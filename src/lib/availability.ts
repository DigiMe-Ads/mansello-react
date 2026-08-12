import type { AvailabilityBlock } from "./api/types";
import { addDaysToKey } from "./date";

// Expands every active [startDate, endDate) block into individual day-keys
// for O(1) lookups while rendering the calendar.
export function buildBlockedDateSet(blocks: AvailabilityBlock[]): Set<string> {
  const set = new Set<string>();
  for (const block of blocks) {
    if (block.status !== "active") continue;
    let cursor = block.startDate.slice(0, 10);
    const end = block.endDate.slice(0, 10);
    while (cursor < end) {
      set.add(cursor);
      cursor = addDaysToKey(cursor, 1);
    }
  }
  return set;
}

export function isRangeAvailable(blocked: Set<string>, checkIn: string, checkOut: string): boolean {
  let cursor = checkIn;
  while (cursor < checkOut) {
    if (blocked.has(cursor)) return false;
    cursor = addDaysToKey(cursor, 1);
  }
  return true;
}
