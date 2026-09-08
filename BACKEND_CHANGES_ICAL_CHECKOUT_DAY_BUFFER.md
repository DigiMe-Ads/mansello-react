# Mansello Frontend → Backend: Airbnb/Booking.com blocks the guest's checkout day

## The problem, as reported

A guest books through Airbnb or Booking.com for, say, the 10th–15th. A
different guest then tries to book directly on our own site with a
check-in of the 15th (the first guest's checkout day) — and can't. The 15th
shows as unavailable, even though the first guest is gone by check-out
time.

## Why this happens

This is **not a bug in how this codebase reads its own blocks** —
`buildBlockedDateSet` (`src/lib/availability.ts`) already treats a block's
`endDate` as exclusive (a `[startDate, endDate)` range), which is the
correct model: a direct booking for the 10th–15th blocks nights
10/11/12/13/14 only, and the 15th is free for a same-day check-in. You can
verify this yourself for *direct* bookings — this only happens for
Airbnb/Booking.com-*imported* dates.

The actual cause is almost certainly one of these two, and they call for
different fixes:

**1. The property's Turnover Buffer setting.** Villa Settings has a
"Turnover Buffer (days)" field (`property.turnoverBufferDays`) that
deliberately requires a gap between any two bookings, for cleaning —
**this applies to every booking, direct or imported, not just OTA ones.**
If this is set to 1 or more, that's an intentional setting, not a bug.
**First thing to check**: open the property in the admin dashboard →
Settings tab → Turnover Buffer, and confirm what it's actually set to. If
it's already 0 and this still only happens for Airbnb/Booking.com
specifically (not for two of your own direct bookings back-to-back), it's
cause #2 below.

**2. How Airbnb/Booking.com's iCal feeds represent checkout day.** This is
a well-known interoperability quirk, not specific to this codebase: Airbnb
(and, per the report, Booking.com) commonly export their availability
calendars with the blocked range extended through the checkout day itself,
as a safety margin — since they have no way to know whether *this* site's
cleaning turnaround supports a same-day check-in right after their guest
leaves, they conservatively block it. If the import job here maps that
feed's `DTEND` directly onto `AvailabilityBlock.endDate` without adjusting
for this, the checkout day ends up genuinely blocked in our own data, and
`buildBlockedDateSet` is correctly reporting an over-broad block it was
given — not misreading a correct one.

## What's possible here — two real options, not a straightforward "fix"

This isn't a bug with one obviously-correct fix — it's a trade-off between
convenience and double-booking risk, and it's the client's call:

**Option A — leave it as-is.** The 1-day safety margin exists precisely to
prevent a real double-booking risk: if a guest's actual departure runs
late, or cleaning takes longer than expected, a same-day back-to-back
booking is what causes an actual conflict at the property. Many hosts using
multiple channels accept this trade-off deliberately. No code change.

**Option B — trim the imported block by one day.** When importing an
Airbnb/Booking.com iCal feed, subtract one day from the parsed `DTEND`
before storing it as `AvailabilityBlock.endDate`, so an OTA booking through
the 15th blocks the same nights a direct booking would (10th–14th, freeing
the 15th) instead of one extra day. This restores same-day turnover
availability, but reintroduces the exact risk the platforms' own padding
was guarding against — recommend pairing this with a small, explicit
`turnoverBufferDays` (e.g. 1) if the client wants some safety margin back,
now applied deliberately and uniformly instead of accidentally and only
for OTA bookings.

If the client wants Option B, a reasonable implementation:

```
// Wherever the iCal import currently does something like:
block.endDate = event.DTEND

// change to:
block.endDate = event.DTEND - 1 day   // only for source: "airbnb" / "booking_com" blocks
```

Make this a **per-property, admin-toggleable setting**
(e.g. `Property.icalCheckoutDayBuffer: boolean`, default `true` = today's
behavior, unchanged) rather than a blanket global change — different
properties may reasonably want different trade-offs here, and toggling it
should not require a code deploy.

## What's already done on the frontend

Nothing — this is a backend-only behavior question, not something the
frontend renders or reacts to differently either way. No frontend changes
are attached to this doc; it exists to hand the two options above to
whoever owns the iCal import job, and to record that Turnover Buffer
(`src/components/admin/villa/villa-settings-tab.tsx`) is a separate,
already-working setting that should be checked and ruled out first.
