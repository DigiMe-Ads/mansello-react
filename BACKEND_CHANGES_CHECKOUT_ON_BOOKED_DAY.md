# Mansello Frontend → Backend: allow check-out on a day that is someone else's check-in

## The problem, as reported

The Nest Bologna has two Airbnb bookings:

| Block | Nights occupied |
|---|---|
| Oct 14 → Oct 15, 2026 | 14th |
| Oct 16 → Oct 18, 2026 | 16th, 17th |

The night of the **15th** is free, so a direct guest should be able to book
**check-in 15th → check-out 16th**. The booking calendar made that
impossible.

## What was wrong on the frontend (fixed)

The calendar disabled every day that is a booked *night*. The 16th is a
booked night (the next guest's first night), so it was greyed out and could
not be picked as a **check-out**. That left no way to finish a selection
starting on the 15th.

That was wrong under our own block model. Blocks are half-open,
`[startDate, endDate)`. Leaving on the morning of the 16th uses the night of
the 15th only, so it doesn't overlap a block starting on the 16th.

Now, once a check-in is picked, a booked day becomes clickable **as a
check-out** if every night from check-in up to it is free
(`isValidCheckOut` in `src/lib/availability.ts`). It still can't be picked as
a check-in. This applies to both the villa booking page and the homepage
reservation widget.

The frontend now **sends** `{ checkIn: "2026-10-15", checkOut: "2026-10-16" }`.
The backend must accept it.

---

## Backend changes / checks

### 1. Overlap check must be half-open (most important)

Wherever a booking or quote is validated against existing blocks
(create booking, pricing/quote endpoint, and anything else that checks
availability), the conflict test must be:

```
conflict  ⇔  existing.startDate < new.checkOut  AND  new.checkIn < existing.endDate
```

Strict `<` on **both** sides. A common bug is `<=`:

```sql
-- WRONG — rejects back-to-back stays (15→16 against a block starting 16th)
where start_date <= :check_out and end_date >= :check_in

-- RIGHT
where status = 'active'
  and start_date < :check_out
  and end_date   > :check_in
```

If the backend expands blocks into a set of nights (the way the frontend
does), the request's nights must be `checkIn … checkOut - 1`, with
`checkOut` itself **excluded**.

### 2. Turnover buffer

`property.turnoverBufferDays` deliberately requires empty days between
bookings. If The Nest Bologna has it set to **1 or more**, the 15→16 stay
is correctly rejected, because it sits directly next to bookings on both sides.
In that case nothing is broken, but the client should know that this setting is why.

- Please check the value for The Nest Bologna:
  `select slug, turnover_buffer_days, min_nights from properties;`
- If the buffer is > 0, the booking/quote error message should say so,
  e.g. *"These dates are too close to another booking (1-day cleaning
  buffer required)."*, rather than a generic "unavailable". The frontend shows
  the API's `message` as-is.

(The frontend calendar doesn't apply the buffer itself, so with a buffer > 0
a guest can select 15→16 and only learn at the quote step that it's not
allowed. If the client wants the buffer, tell us and we'll grey those days
out in the calendar too, using `turnoverBufferDays` from the property
response.)

### 3. Minimum nights

If `min_nights` for the property is 2 or more, a one-night 15→16 stay is
correctly blocked. The calendar already shows "Minimum stay is N nights" in
that case. Nothing to change. Just confirm the value with the client if
they're surprised.

### 4. iCal export

Once a direct booking for 15→16 exists, our export feed must emit it as
`DTSTART;VALUE=DATE:20261015` / `DTEND;VALUE=DATE:20261016` (exclusive
end), so Airbnb and Booking.com block only the 15th and not the 16th.

---

## Test vectors

Existing active blocks: `[2026-10-14, 2026-10-15)` and
`[2026-10-16, 2026-10-18)`. `turnoverBufferDays = 0`, `minNights = 1`.

| Request check-in → check-out | Expected |
|---|---|
| 15 → 16 | **accepted** (fills the gap exactly) |
| 15 → 17 | rejected (overlaps night of 16th) |
| 13 → 15 | rejected (overlaps night of 14th) |
| 18 → 20 | accepted (check-in on the other guest's check-out day) |
| 12 → 14 | accepted (check-out on the other guest's check-in day) |

With `turnoverBufferDays = 1`: 15 → 16, 18 → 20 and 12 → 14 are all
rejected, each with a message mentioning the buffer.
