# Mansello Frontend → Backend: villa airport-transfer pricing

Adds a priced airport-transfer add-on to villa bookings, configured per party
size (1–8 guests) on a new **Transport** tab in the villa admin.

The frontend is built and live behind 404-safe fallbacks: until these endpoints
exist, the admin tab renders an editable table with a "not available yet"
notice, and the booking widget shows placeholder prices from a seed table so
the feature is visible and testable.

**Read section 6 before deploying** — in that pre-backend state the transfer is
shown and added to the displayed total, but not actually charged.

---

## 1. What this is, and what it is not

**Is:** a priced add-on. The guest ticks a box during booking, sees the price,
and it is added to the amount they pay at checkout.

**Is not:** a replacement for the existing transport *enquiry*
(`POST /api/leads/transport-requests`). That still fires alongside, carrying
flight number, date and notes, and is what operations actually uses to arrange
the vehicle. Nothing about it changes.

Two properties of the pricing model matter:

- **Priced per party, not per person.** A transfer for 4 guests is one vehicle,
  not 4 × the 1-guest price. The admin enters the total for the party.
- **Charged once per booking, never per night.** A 7-night stay with a transfer
  is charged the transfer price once.

---

## 2. Data model

### New `transport_rates` table

```sql
create table transport_rates (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  guest_count  int  not null check (guest_count between 1 and 8),
  price        numeric(10,2) not null default 0,
  active       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (property_id, guest_count)
);
```

`active` is separate from `price` deliberately: it lets the client stop
offering transfers for, say, 7–8 guests (no vehicle that size) without losing
the price they had configured.

### `Property` gains two fields

```diff
 {
   ...
   pricingTiers: PricingTier[]
+  transportEnabled?: boolean      // optional; see note below
+  transportRates?: TransportRate[]
 }
```

**Update (this revision): `transportEnabled` now has an admin control and the
frontend honours it.** The villa admin's Transport tab has a master on/off
switch, separate from the per-row `active` flags — turning it off hides the
airport-transfer option from guests entirely (for either property, Dona's
Villa or The Nest Bologna), whatever the per-party-size table says. Turning it
back on restores whatever was already configured. It's saved as its own PATCH
so flipping it doesn't require resubmitting the price table:

```
PATCH /api/properties/:propertyId   { "transportEnabled": true | false }
```

This reuses the same property-update endpoint the Settings tab already calls
for `minNights`, `checkInTime`, etc. — no new route needed, just accept
`transportEnabled` as one more optional field on it, restricted to the same
admin roles (`super_admin`, `villa_manager` scoped to their property). It also
now sends `maxGuests` — see `BACKEND_CHANGES_ADMIN_CONTENT_REQUESTS.md` for
that one, since it's unrelated to transport.

**A `false`/missing value must still mean "off"**, i.e. **default the column
to `false`** if it doesn't exist yet — the frontend now reads this
per-property field to decide whether to show the add-on at all, so an
untouched property should not surface it. This is a change from the original
version of this doc, which called for `transportEnabled` to be ignored
specifically to avoid a `default false` column stranding the feature off with
no way to flip it back on. That concern is resolved now that the admin toggle
exists — a client just switches it on once it's ready to offer transfers.

Both fields optional. Absent reads as "this property doesn't offer
transfers", which is what a not-yet-migrated backend should look like.

Embedding `transportRates` on the property response is what lets the booking
page show the price without a second round trip — the same pattern
`pricingTiers` and `rateOverrides` already use.

### `Booking` gains one field

```diff
 {
   ...
   accommodationPrice?: string
+  transportPrice?: string   // set only when a transfer was actually charged
   cityTax?: string
   totalPrice: string
 }
```

`totalPrice` **must include** `transportPrice`. The payment step renders
`transportPrice` as its own line so the guest can see what they paid for.

---

## 3. Endpoints

### `GET /api/properties/:propertyId/transport-rates` — public

Guests need the price before they book, so this is unauthenticated like the
rest of the property pricing data.

```json
[
  { "id": "...", "propertyId": "...", "guestCount": 1, "price": "25.00", "active": true },
  { "id": "...", "propertyId": "...", "guestCount": 2, "price": "25.00", "active": true },
  { "id": "...", "propertyId": "...", "guestCount": 4, "price": "40.00", "active": true }
]
```

Returning only the rows that exist is fine — the admin UI merges them onto a
fixed 1–8 skeleton, and the booking flow treats a missing row as "not offered
for that party size".

### `PUT /api/admin/properties/:propertyId/transport-rates` — admin

Roles: `super_admin`, `villa_manager` (scoped to their property).

Replaces the whole table in one call — the admin form saves all eight rows
together.

```json
{ "rates": [
    { "guestCount": 1, "price": 25.00, "active": true },
    { "guestCount": 2, "price": 25.00, "active": true },
    { "guestCount": 3, "price": 40.00, "active": true },
    { "guestCount": 4, "price": 40.00, "active": true },
    { "guestCount": 5, "price": 0,     "active": false },
    { "guestCount": 6, "price": 0,     "active": false },
    { "guestCount": 7, "price": 0,     "active": false },
    { "guestCount": 8, "price": 0,     "active": false }
] }
```

Returns the saved rows. Upsert on `(property_id, guest_count)`.

---

## 4. `POST /api/bookings` — the important part

### The request carries a flag, never an amount

```diff
 {
   propertyId, guestName, guestEmail, guestPhone,
   checkIn, checkOut, guests, rooms, roomIds, childrenUnder14,
+  transportRequested?: boolean
 }
```

**This is deliberate and must stay that way.** `CreateBookingInput` contains no
prices at all today — every amount is server-computed — and that is exactly why
villa bookings were clean in the security review while the marketplace's
client-sent `shippingFee` was flagged as tamperable. Sending a
`transportPrice` from the client would reintroduce the same hole.

### Server-side pricing

```
if transportRequested is not true            -> transportPrice = 0
if property.transportEnabled is false        -> transportPrice = 0
row = transport_rates where property_id = ? and guest_count = booking.guests
if no row, or row.active is false            -> transportPrice = 0
otherwise                                    -> transportPrice = row.price
```

Then:

```
totalPrice = accommodationPrice + cityTax + transportPrice
```

Charged **once**, not multiplied by nights.

Two edge cases worth deciding explicitly:

1. **`transportRequested: true` but no active rate for that party size.** The
   guest should not have been able to tick the box (the frontend hides the
   price when there's no rate), so this means stale data or a crafted request.
   Charging 0 and proceeding is the safer behaviour — a booking should not fail
   over an optional extra. Whichever you choose, don't error.
2. **Guest count changes after the rate is read.** The booking's `guests` value
   at creation time is the authority. Price from that, not from anything the
   client looked up earlier.

### `guest_count` matching is exact, not banded

A row exists per guest count 1–8. Don't range-match — if there's no row for 5
guests, transfers aren't offered for 5 guests.

---

## 5. Frontend changes already shipped

**Admin**
- `src/components/admin/villa/villa-transport-tab.tsx` — the "Transport" tab
  on every villa, showing a labelled 1–8 table with a price field and an
  "Offered to guests" checkbox per row, **plus a new master on/off switch**
  above the table (calls `PATCH /api/properties/:propertyId` with
  `{ transportEnabled }`, optimistic with rollback on failure). Works
  identically for both properties (Dona's Villa and The Nest Bologna) since
  the tab and the property-update endpoint are already shared across
  properties.
- Tab registered in `src/pages/admin/(protected)/villas/[propertyId]/page.tsx`.

**Public booking flow**
- `src/lib/api/transport-rates.ts` — new API module.
- `src/lib/api/pricing.ts` — `resolveTransportPrice(rates, guestCount)`;
  `StayBreakdown.transportPrice`; both breakdown functions accept it and
  include it in `grandTotal`.
- `src/components/booking/booking-provider.tsx` — fetches the rates and
  resolves the price for the current party size, exposes it as
  `transportPrice`, and sends `transportRequested` on booking creation.
  `transportPrice` now resolves straight to `null` (hiding the add-on) when
  `property.transportEnabled === false`, before it even looks at the rates.
- `src/lib/transport-seed-data.ts` — placeholder prices per property, used
  only while the endpoint is missing (same pattern as
  `testimonials-seed-data.ts`). Delete it, or return `[]` from
  `seedTransportRates()`, once real rates are being served.

**Rate resolution order** (first *configured* source wins — note: configured,
not merely present):

1. `GET /api/properties/:id/transport-rates`
2. `transportRates` embedded on the property response
3. the seed table

A source counts as configured only if it contains at least one row with
`active: true` **and** `price > 0`. This matters because once the table exists
the endpoint returns all eight guest-count rows, so an untouched property
answers with eight rows of `{ price: 0, active: false }` — non-empty, but
nothing bookable. Testing array length alone would accept that placeholder
table and silently hide the add-on, which is exactly the bug this replaced.

A row with `active: true` but `price: 0` is treated as unconfigured rather than
as a free transfer.

So implementing *either* endpoint shape works — you do not have to embed
`transportRates` on the property if the standalone endpoint is easier.
- `src/components/booking/guest-details-form.tsx` — the existing "Add an
  airport transfer?" checkbox now shows `+<price>` when one applies, and the
  helper text switches from "we'll reach out separately" to "added to your
  total below and charged with your booking".
- `src/components/booking/payment-step.tsx` — renders an "Airport transfer"
  line, including for properties with no city tax (where the price-breakdown
  block doesn't otherwise render).

**When the endpoints ship, no frontend change is needed.** The price appears as
soon as `GET /api/properties/:id` starts returning `transportRates`.

---

## 6. Until this ships, the transfer is quoted but not charged

Worth being explicit about, because it is a revenue risk rather than a cosmetic
one. The frontend currently shows a seed price in the booking widget and adds
it to the displayed total, but `POST /api/bookings` ignores `transportRequested`
— so the server-computed `totalPrice` excludes it. A guest who ticks the box is
quoted the transfer and then **charged without it**.

Two ways to avoid that window:

- Ship §4 (the `transportRequested` handling) in the same release as §3, or
- Disable the add-on until then by returning `[]` from `seedTransportRates()`
  in `src/lib/transport-seed-data.ts` — a one-line change that hides the row
  entirely.

## 7. Suggested rollout order

1. Table + both endpoints. Admin can configure prices; guests see nothing yet
   because `transportRates` isn't on the property response.
2. Add `transportRates` / `transportEnabled` to `GET /api/properties/:id`.
   Guests now see the price on the checkbox — **but it is not yet charged**, so
   keep this window short.
3. Handle `transportRequested` in `POST /api/bookings` and include
   `transportPrice` in `totalPrice` and on the `Booking` response.

Step 2 before step 3 is the only ordering that can quote a price without
charging it. If that matters, do 2 and 3 in the same deploy.
