# Mansello Frontend → Backend: individually-bookable rooms for Dona's Villa

## The problem

Dona's Villa (Sri Lanka) has always booked as "1-3 rooms" — an anonymous
*count*, priced off a `guestCount × rooms` pricing-tier matrix
(`PricingTier`). That's never matched reality: the villa has three actual,
distinct rooms (each with its own name, photos, capacity and rate), and
guests currently have no way to say *which* room(s) they want.

We've now added three real rooms — with names and photos — and the frontend
has been built out to let guests pick specific rooms at checkout. That needs
a few backend additions to actually work; until they ship, the site
transparently falls back to today's count-based behavior (see "Impact until
this ships" below).

The three rooms, from the photos already dropped in
`public/images/sri-lanka/rooms/` on the frontend (filenames are the intended
room names; the one with a "2" is a second photo of the same room, not a
4th room):

| Room name | Subtitle | Capacity | Photos |
|---|---|---|---|
| Ella Room | Double room | 2 | `Ella Room — Double room.jpeg`, `Ella Room — Double room 2.jpeg` |
| Mirissa Room | Double room | 2 | `Mirissa-Room —Double-room.jpeg` |
| Sigiriya Family Suite | 4 guests | 4 | `Sigiriya Family Suite — 4 guests.jpeg` |

These don't need to be seeded by hand — once the endpoints below exist, an
admin creates them through the new "Rooms" tab (uploads the same photos
through the existing image-upload flow). Nothing here requires the backend
to know these three names/photos in advance.

## What "individually-bookable rooms" needs to mean

1. Guests pick specific room(s), not just a room *count* — the booking
   records exactly which rooms were reserved.
2. Availability is per-room. If 2 of the villa's 3 rooms are booked for a
   given date range, the 3rd room (and the property overall) must still be
   bookable — today's model blocks the *whole property* the instant any
   booking exists for a date, which is now wrong.
3. Price is the sum of the selected rooms' own nightly rates × nights,
   instead of a `guestCount × rooms` tier lookup.
4. This only applies to properties that actually have rooms configured.
   The Nest Bologna (Italy) books as a single unit and must keep working
   exactly as it does today — every change below is additive/optional and
   should no-op for a property with zero rooms.
5. Whichever rooms exist, and their prices/capacities/photos, must be fully
   admin-configurable — nothing about this is hardcoded on the frontend.

## Data model

### New `Room` table

```
Room
  id            string (pk)
  propertyId    string (fk -> Property.id)
  name          string        -- "Ella Room"
  subtitle      string        -- "Double Room" / "Family Suite — 4 guests"
  capacity      int           -- max guests this room sleeps
  pricePerNight decimal
  images        string[]      -- same S3-backed upload flow as products/offers
  sortOrder     int  default 0
  active        boolean default true
  createdAt     timestamptz
  updatedAt     timestamptz
```

`active: false` lets an admin retire a room (e.g. taken out of service)
without breaking historical bookings that reference it.

### `AvailabilityBlock` gets an optional `roomId`

```
AvailabilityBlock.roomId  string | null (fk -> Room.id, nullable)
```

- `roomId: null` — blocks **every room** on the property. This is how
  whole-property blocking keeps working unchanged: existing manual blocks,
  Airbnb iCal imports, and any property that has no rooms at all (The Nest
  Bologna) all keep using `roomId: null` exactly like today.
- `roomId: <id>` — blocks just that one room. This is what a room-scoped
  booking or a room-scoped manual block creates.

A date is "available" for a given room if there's no active block that is
either `roomId: null` or `roomId` equal to that room. A date only makes the
*whole property* unavailable once every one of its rooms is individually
blocked — see `buildBlockedDateSetForRooms` in
`src/lib/availability.ts` on the frontend for the exact client-side version
of this logic; the server should apply the same rule when validating a
booking request (a room is bookable iff no active block — property-wide or
room-specific — overlaps the requested range for that room).

### `Booking` gets `roomIds`

```
Booking.roomIds  string[]   -- the specific Room ids reserved (join table
                                or a simple array column, whichever this
                                schema already prefers for similar cases)
```

- Required (non-empty) when `propertyId` refers to a property that has
  rooms; must stay empty/omitted for single-unit properties.
- Every id in `roomIds` must belong to the same property.
- The sum of the referenced rooms' `capacity` must be `>= guests`. Reject
  otherwise (this is the "guest picked too few/wrong rooms for their party
  size" validation — the frontend already prevents this in the UI, but it
  must be re-checked server-side same as every other client-supplied
  number here).
- `rooms` (the existing count field) should just be
  `roomIds.length` for these bookings — either have the backend derive it,
  or validate the client-sent value matches.
- On create: run the same per-room overlap check as availability (above)
  for *every* room in `roomIds`, inside the same transaction/lock that
  today's single property-wide overlap check uses, so two guests can't
  race each other onto the same room. On success, create one
  `AvailabilityBlock` per reserved room (`source: "direct"`, `roomId` set,
  `bookingId` set) instead of today's single whole-property block.
- On cancel/refund: release all of that booking's per-room blocks (same as
  today's single block, just now potentially several rows).

### Admin visibility — every booking-returning endpoint must include `roomIds`

The admin dashboard now shows which specific room(s) a booking is for (both
in the bookings list, and it can create an offline booking against specific
rooms) — this is the whole point of the feature from the property manager's
side, so it's worth calling out explicitly rather than leaving it implied:
`roomIds` needs to be serialized on **every** endpoint that returns a
`Booking`, not just the create response. Concretely, all four of these need
it in their response body wherever they already return a booking object:

- `GET /api/bookings/property/:propertyId` (admin bookings list)
- `GET /api/bookings/:id` (single booking / confirmation page)
- `POST /api/bookings` (guest checkout)
- `POST /api/bookings/offline` (admin-created booking — extend to accept
  `roomIds` in the request body too, same validation as `POST
  /api/bookings` above)
- `POST /api/bookings/:id/cancel` (returns the updated booking)

It's easy to add the column/relation but forget to select it on one of
these — the admin table will just silently show the old count-only fallback
for that booking if it's missing, so it's worth double-checking each one
returns it once this ships.

### Pricing

For a property with rooms, `accommodationPrice = nights × Σ(pricePerNight
of each room in roomIds)`. This replaces the `PricingTier` lookup for that
property — `PricingTier` can stay in the schema unused for it, or be
dropped for that property, whichever is less disruptive; The Nest Bologna
keeps using `PricingTier` exactly as today. City tax (Bologna-only today)
isn't relevant to Dona's Villa, but if a future room-enabled property ever
needs it, the calculation composes the same way: tax off the summed
`pricePerNight`, same as it already does off the tier's price.

**As always, the server must recompute and charge based on this itself —
never trust a client-sent total.**

## Endpoints

### `GET /api/properties/:propertyId/rooms`

Public. Returns that property's **active** rooms, sorted by `sortOrder`.
Add `?includeInactive=true`, honored only for a request authenticated as
`super_admin` or a `villa_manager` scoped to this property — returns every
room regardless of `active`. This mirrors how `GET /api/blog/posts` already
branches on admin auth to include drafts.

**This is the one source of truth every admin screen uses for room data** —
the Rooms tab, the Blocks tab's per-room block selector, and the Bookings
tab's id→name resolution all call this endpoint directly (with the admin's
token, so `includeInactive` actually applies) instead of trusting a `rooms`
field on the property object. Don't also bother embedding `rooms` on `GET
/api/properties` (the plural, admin property-*list* endpoint) — nothing
reads it from there, and adding it there but not here (or vice versa) is
exactly how the "Unknown room" bug below happened the first time.

```json
[
  {
    "id": "...", "propertyId": "...", "name": "Ella Room",
    "subtitle": "Double Room", "capacity": 2, "pricePerNight": "45.00",
    "images": ["https://.../ella-1.jpg", "https://.../ella-2.jpg"],
    "sortOrder": 0, "active": true,
    "createdAt": "...", "updatedAt": "..."
  }
]
```

### `POST /api/properties/:propertyId/rooms` (admin: `super_admin` or scoped `villa_manager`)

Body: `{ name, subtitle?, capacity, pricePerNight, images?, sortOrder? }` →
`201` with the created `Room`.

### `PATCH /api/rooms/:roomId` (admin)

Body: any subset of `{ name, subtitle, capacity, pricePerNight, images,
sortOrder, active }` → updated `Room`.

### `DELETE /api/rooms/:roomId` (admin)

Reject (`409`) if the room is referenced by any non-cancelled booking's
`roomIds` — same "can't delete, has history" guard used elsewhere in this
API; deactivate (`PATCH { active: false }`) instead for that case.

### `GET /api/properties/:slug` (existing — extend)

Include a `rooms` array on the response (active rooms only, sorted by
`sortOrder`) for any property that has them, so the public site gets them
for free alongside `pricingTiers` — no extra request needed to render the
"choose your room" section or the booking picker. Omit/empty array for
properties with none (The Nest Bologna).

### `GET /api/availability/:propertyId` (existing — extend)

Each returned block should include its `roomId` (`null` for
whole-property blocks). No other shape change.

### `POST /api/availability/:propertyId/blocks` (existing manual-block endpoint — extend)

Accept an optional `roomId` in the body, so an admin can block one specific
room (e.g. for maintenance) instead of the whole property. Omit for
today's whole-property behavior, unchanged.

### `POST /api/bookings` (existing — extend)

Accept an optional `roomIds: string[]` in the body. Validate and persist as
described under "Booking" above.

## What's already done on the frontend

- `Room`, `CreateRoomInput`, `UpdateRoomInput` types, and `Property.rooms?`
  / `AvailabilityBlock.roomId?` / `Booking.roomIds?` /
  `CreateBookingInput.roomIds?` (`src/lib/api/types.ts`).
- `src/lib/api/rooms.ts` — calls the endpoints above (currently 404s until
  they exist).
- `src/lib/availability.ts` — `buildBlockedDateSet` now takes an optional
  `roomId` filter, and `buildBlockedDateSetForRooms` computes the
  "blocked only once every room is taken" rule described above.
- `src/lib/api/pricing.ts` — `computeRoomsStayTotal` /
  `computeRoomsStayBreakdown` (price = sum of selected rooms' rates) and
  `estimateCheapestRoomsTotal` (a "from" price preview for the homepage
  widget, before the guest has picked rooms).
- `BookingProvider` (`src/components/booking/booking-provider.tsx`) tracks
  `selectedRoomIds`, exposes `toggleRoom`, and sends `roomIds` on booking
  creation.
- `BookingCalendarView` shows a room-picker (photo, name, subtitle,
  capacity, price, live availability, Booked/selectable state) once
  `property.rooms` is non-empty, and blocks Reserve until the selected
  rooms' combined capacity covers the guest count. Properties without
  rooms (Italy) are completely unaffected — same UI as before.
- `src/components/sri-lanka/room-pricing.tsx` — new "browse the rooms"
  section with photos + nightly rate per room, shown upfront (replaces the
  old guests×rooms rate table).
- Admin: a new "Rooms" tab (`src/components/admin/villa/villa-rooms-tab.tsx`)
  for CRUD + photo upload on a property's rooms, and the "Calendar &
  Blocks" tab can now target a manual block at one specific room.
- Admin "Bookings" tab (`src/components/admin/villa/villa-bookings-tab.tsx`)
  now resolves each booking's `roomIds` to room names and shows them
  instead of the plain room *count* whenever they're present, and its
  "New Offline Booking" form lets staff pick specific rooms (sends
  `roomIds`) for a room-enabled property instead of typing a room count.
  An id that doesn't resolve shows `Unknown room (id fragment)` instead of
  going silent, so it's at least traceable against the Rooms tab.
- **Fixed a real bug** this surfaced once rooms went live: the villa detail
  admin page was sourcing `rooms` off `property.rooms` (from `getProperties()`,
  the admin's property-*list* endpoint) instead of the dedicated `/rooms`
  endpoint — so real, correctly-named rooms showed as "Unknown room" on
  every booking, purely because that list endpoint was never asked to embed
  `rooms` (only `GET /api/properties/:slug` was). Every admin screen now
  fetches rooms from `GET /api/properties/:propertyId/rooms` directly (see
  the callout on that endpoint above) — this is fixed on the frontend and
  needs no backend change, just flagging so nobody "fixes" it again the other
  way by embedding `rooms` on the list endpoint too.

## Impact until this ships

- `GET /api/properties/.../rooms` and the room CRUD endpoints 404 — the
  admin Rooms tab shows "Not available yet" (same pattern as the Offers
  tab before its endpoint existed) and nothing is created.
- `GET /api/properties/:slug` doesn't return `rooms` yet, so
  `property.rooms` is always empty on the public site — the booking flow
  and room-pricing section keep behaving exactly as they do today (count-
  based room selector, guests×rooms rate lookup). No regression, just
  missing the new capability.
- Once rooms exist for Dona's Villa but before the availability/booking
  endpoints are extended: the frontend will show rooms and let guests
  select them, but a booking's `roomIds` won't be persisted or checked for
  per-room conflicts — two guests could double-book the same physical room
  even though the property-level date is (correctly, per the old logic)
  shown as available. **Ship the `AvailabilityBlock`/`Booking` changes
  before enabling rooms for a live property**, or a manual double-booking
  risk exists in that window.
- Until every endpoint in "Admin visibility" above returns `roomIds`, the
  admin Bookings tab just falls back to showing the plain "N room(s)" count
  it shows today for that booking — it degrades gracefully, not a crash,
  but staff won't be able to see which specific room a guest is in until
  it's wired up everywhere.
