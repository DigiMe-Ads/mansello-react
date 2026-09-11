# Mansello Frontend → Backend: subtract one day from imported Airbnb / Booking.com blocks

Implementation spec for **Option B** in
`BACKEND_CHANGES_ICAL_CHECKOUT_DAY_BUFFER.md`. That document laid out the
problem and two possible responses; the client has chosen to trim the imported
block by a day so the checkout date becomes bookable again. This file is the
"how".

Backend-only. **No frontend change is attached to this** —
`buildBlockedDateSet` (`src/lib/availability.ts`) already models blocks as
half-open `[startDate, endDate)` and will free the checkout day the moment the
stored data stops covering it.

---

## 1. Read this before writing any code

**Do not apply `-1` blindly.** Whether it is correct depends on what your
import currently stores, and getting it wrong turns a one-day-too-many bug into
a one-day-too-few bug — which causes real double-bookings rather than merely
lost ones.

### The semantics

`AvailabilityBlock.endDate` in this system is **exclusive**. A block of
`{ startDate: "2026-06-10", endDate: "2026-06-15" }` blocks the nights of the
10th, 11th, 12th, 13th and 14th. **The 15th is free**, which is what allows a
new guest to check in the morning the previous one checks out.

Per RFC 5545, a `DATE`-valued `DTEND` in an iCal `VEVENT` is **also
exclusive**. Airbnb and Booking.com both export stay events as:

```
DTSTART;VALUE=DATE:20260610      <- check-in
DTEND;VALUE=DATE:20260615        <- check-out, exclusive
```

So `endDate = DTEND`, copied straight across, is **already correct** and needs
no adjustment.

### Which means the bug is one of these

| Cause | What's stored for a 10th–15th stay | Fix |
|---|---|---|
| **A.** Import treats `DTEND` as inclusive and stores `DTEND + 1` | endDate `2026-06-16` | Stop adding the day. The `-1` below is really "remove the +1". |
| **B.** Import stores `DTEND` correctly, but the feed itself pads the checkout day | endDate `2026-06-16` in the feed | Apply `-1` on import. |
| **C.** Import stores `DTEND` correctly and the feed is correct | endDate `2026-06-15` | **Nothing is wrong here.** Applying `-1` would free the 14th — a night that is genuinely occupied. Look at `turnoverBufferDays` instead. |

### Confirm which one you have first

Take a known OTA booking whose real check-in and check-out dates you can verify
in the Airbnb/Booking.com dashboard, then:

```sql
select id, source, start_date, end_date
from availability_blocks
where source in ('airbnb', 'booking_com')
order by start_date desc
limit 20;
```

For a stay of the 10th → 15th:

- `end_date = 2026-06-15` → **case C. Stop. Do not apply this change.** Check
  the property's Turnover Buffer setting (Villa admin → Settings → Turnover
  Buffer) — a value of 1 or more blocks the checkout day by design, for every
  booking, and that is the far more likely culprit.
- `end_date = 2026-06-16` → case A or B. Proceed.

Also confirm the same stay booked **directly** on our own site does not block
its checkout day. If direct bookings block it too, the cause is
`turnoverBufferDays`, not the iCal import, and this change will not help.

---

## 2. The change

Only for blocks whose `source` is an OTA feed. Direct bookings must not be
touched — they already write a correct exclusive `endDate`.

```
// in the iCal import job, per VEVENT:

endDate = parseDate(event.DTEND)

if (source === 'airbnb' || source === 'booking_com') {
  if (property.icalCheckoutDayBuffer === false) {
    endDate = endDate - 1 day
  }
}
```

Note the sense of the flag: `icalCheckoutDayBuffer` **true means keep today's
padded behaviour**, so an unset/legacy property is unchanged. Only setting it
to `false` opts a property into the trimmed behaviour. That way the migration
adding the column changes nothing on its own.

### Make it per-property and admin-toggleable

```sql
alter table properties
  add column ical_checkout_day_buffer boolean not null default true;
```

Two properties in two countries with different cleaning arrangements can
reasonably want different answers, and flipping it must not require a deploy.
Surface it on the villa **Settings** tab next to Turnover Buffer, since they
interact (see §4).

If you would rather not build the admin control right now, ship the column and
set it directly in the database — but please still make it a column rather than
a hardcoded constant.

---

## 3. Idempotency — the thing most likely to go wrong

iCal imports usually run on a schedule and re-process the same events. **The
subtraction must happen at parse time, on the value read from the feed, never
as an update to an already-stored row.** A job that does

```sql
update availability_blocks set end_date = end_date - 1 where source = 'airbnb'
```

will silently eat another day on every run, and a week later an OTA guest's
whole stay is bookable.

Safe implementations:

- **Recompute from the feed each run.** Delete-and-reinsert, or upsert keyed on
  the event `UID`, always deriving `end_date` from `DTEND` in that run. The
  transformation is then a pure function of feed input and is naturally
  idempotent.
- **Or store both.** Keep the raw `DTEND` in a `source_end_date` column and
  derive `end_date` from it. This also makes the adjustment auditable and lets
  you flip `icalCheckoutDayBuffer` for existing blocks without re-fetching.

The second is worth the extra column if imports are frequent.

---

## 4. Interaction with Turnover Buffer

`turnoverBufferDays` already exists and enforces a gap between **any** two
bookings, direct or imported. It is applied on top of the blocked-date set, so
its effect compounds with this change.

- Trimming a day and leaving `turnoverBufferDays: 1` produces **no net change**
  in bookability — you give the day back, then block it again.
- Trimming a day with `turnoverBufferDays: 0` gives true same-day turnover, and
  removes every safety margin.

If the client wants the checkout day back *and* some protection, the right
combination is `icalCheckoutDayBuffer: false` with `turnoverBufferDays: 0`, and
accepting the risk — or leaving the buffer at 1 and recognising there is
nothing to gain from this change. Worth putting in front of them explicitly,
because the two settings can silently cancel out and look like the deploy
did nothing.

---

## 5. Edge cases

**One-night stays.** A 10th → 11th booking has `DTEND` one day after
`DTSTART`. Subtracting a day yields `startDate == endDate`, which under
half-open `[start, end)` semantics blocks **nothing** — the booking vanishes
from the calendar and the night can be double-sold. **Guard against this:**

```
if (endDate <= startDate) endDate = startDate + 1 day   // keep at least one night
```

This case only arises under cause A/B for a genuine one-night OTA stay, but it
is exactly the kind of booking that gets double-sold, so do not skip it.

**`DTEND` absent.** RFC 5545 permits a `VEVENT` with `DTSTART` and no `DTEND`;
for a `DATE` value it means a one-day event. Treat it as
`endDate = DTSTART + 1 day` **before** applying any adjustment, then let the
one-night guard above catch it.

**`DATE-TIME` rather than `DATE`.** Some feeds emit
`DTEND:20260615T100000Z`. That is a real checkout *time*, not a padded day —
truncate to the date and do **not** subtract. Branch on the value type, and
only apply the adjustment to `VALUE=DATE`.

**Timezones.** Compare and store as plain `YYYY-MM-DD` day-keys throughout, as
the rest of the system does (`@db.Date`, and `src/lib/date.ts` on the
frontend). Converting a floating iCal `DATE` into a UTC instant and back is how
these bugs get created — never do local-timezone `Date` arithmetic on these
values.

**Cancelled events.** `STATUS:CANCELLED` events should be removed, not
adjusted.

---

## 6. Test vectors

Property with `icalCheckoutDayBuffer: false`, `turnoverBufferDays: 0`. Feed
values are what the OTA sends under cause A/B (checkout day included).

| Feed DTSTART | Feed DTEND | Stored startDate | Stored endDate | Nights blocked | 15th bookable? |
|---|---|---|---|---|---|
| 2026-06-10 | 2026-06-16 | 2026-06-10 | 2026-06-15 | 10–14 | **yes** |
| 2026-06-10 | 2026-06-12 | 2026-06-10 | 2026-06-11 | 10 only | n/a |
| 2026-06-10 | 2026-06-11 | 2026-06-10 | 2026-06-11 | 10 only (guard applied) | n/a |
| 2026-06-10 | *absent* | 2026-06-10 | 2026-06-11 | 10 only (guard applied) | n/a |
| 2026-06-10 | 2026-06-15T10:00Z | 2026-06-10 | 2026-06-15 | 10–14 (no subtraction) | **yes** |

With `icalCheckoutDayBuffer: true` (the default), row 1 stores `2026-06-16` and
the 15th stays blocked — today's behaviour, unchanged.

### Regression check

The most valuable test is the one that catches a double-booking: import a
known OTA stay, then attempt a **direct** booking that overlaps its middle
nights. It must still be rejected. If trimming a day has made the 14th
bookable on a 10th–15th stay, the subtraction has been applied to case C and
must be reverted.

---

## 7. Rollback

Set `ical_checkout_day_buffer = true` for the affected property and re-run the
import. Because the adjustment is derived from the feed rather than applied to
stored rows (§3), the previous values come back on the next successful sync —
no data migration needed.

If you took the `source_end_date` approach, `end_date` can be recomputed
in place without waiting for a sync.

---

## 8. What is already correct, and should not be changed

Stated explicitly so nobody "fixes" it while in here:

- `src/lib/availability.ts` — `buildBlockedDateSet` uses `while (cursor < end)`,
  a correct half-open range. It has never been the bug.
- Direct bookings write an exclusive `endDate` and already free the checkout
  day.
- The frontend needs no change for any of this and has no awareness of the
  flag.
