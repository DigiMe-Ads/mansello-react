# Mansello Frontend → Backend: villa airport-transfer pricing

Adds a priced airport-transfer add-on to villa bookings, configured per party
size (1–8 guests) on a new **Transport** tab in the villa admin.

The frontend is built and live behind 404-safe fallbacks: until these endpoints
exist, the admin tab renders an editable table with a "not available yet"
notice, and the guest-facing booking flow simply doesn't show a price (it falls
back to the existing unpriced "we'll arrange it separately" enquiry, which is
unchanged).

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
+  transportEnabled?: boolean      // false hides the option entirely
+  transportRates?: TransportRate[]
 }
```

Both optional. Absent reads as "this property doesn't offer transfers", which
is what a not-yet-migrated backend should look like.

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
- `src/components/admin/villa/villa-transport-tab.tsx` — new "Transport" tab on
  every villa, showing a labelled 1–8 table with a price field and an
  "Offered to guests" checkbox per row.
- Tab registered in `src/pages/admin/(protected)/villas/[propertyId]/page.tsx`.

**Public booking flow**
- `src/lib/api/transport-rates.ts` — new API module.
- `src/lib/api/pricing.ts` — `resolveTransportPrice(rates, guestCount)`;
  `StayBreakdown.transportPrice`; both breakdown functions accept it and
  include it in `grandTotal`.
- `src/components/booking/booking-provider.tsx` — resolves the price for the
  current party size, exposes it as `transportPrice`, and sends
  `transportRequested` on booking creation.
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

## 6. Suggested rollout order

1. Table + both endpoints. Admin can configure prices; guests see nothing yet
   because `transportRates` isn't on the property response.
2. Add `transportRates` / `transportEnabled` to `GET /api/properties/:id`.
   Guests now see the price on the checkbox — **but it is not yet charged**, so
   keep this window short.
3. Handle `transportRequested` in `POST /api/bookings` and include
   `transportPrice` in `totalPrice` and on the `Booking` response.

Step 2 before step 3 is the only ordering that can quote a price without
charging it. If that matters, do 2 and 3 in the same deploy.
