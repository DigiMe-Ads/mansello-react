# Mansello Frontend → Backend: seasonal pricing, discounts, whole-villa locking, shipping & featured categories

Five independent changes, bundled into one doc because they shipped together
on the frontend. Each section is self-contained — read whichever ones are
relevant to what's being implemented.

1. [Seasonal/date-range pricing overrides](#1-seasonal-pricing-overrides-rateoverride)
2. [Date-scoped discounts on offers](#2-date-scoped-discounts-offer-startdate--enddate)
3. [Sri Lanka villa: whole-property locking (supersedes per-room availability)](#3-whole-villa-locking-supersedes-per-room-availability)
4. [Marketplace weight-based shipping](#4-marketplace-weight-based-shipping)
5. [Featured marketplace categories](#5-featured-marketplace-categories)

---

## 1. Seasonal pricing overrides (`RateOverride`)

### The problem

Both properties currently have exactly one price per configuration — a
room's `pricePerNight` (Dona's Villa) or a `PricingTier.pricePerNight`
(The Nest Bologna) — with no way to charge more for, say, the last two
weeks of December. Admins need to set a different nightly rate for a
specific date or date range, without touching the base rate that applies
everywhere else. Guests must never see a calendar of these — only the
resolved price for whatever dates they've actually picked.

### Data model

```
RateOverride
  id             string (pk)
  propertyId     string (fk -> Property.id)
  roomId         string | null (fk -> Room.id, nullable)
  guestCount     int | null
  rooms          int | null
  startDate      date
  endDate        date          -- inclusive; admin picks a range like a normal date field
  pricePerNight  decimal
  createdAt      timestamptz
  updatedAt      timestamptz
```

Exactly one of `roomId` or `(guestCount, rooms)` is set per row, matching
whichever pricing model the property uses — `roomId` for room-based
properties (Dona's Villa), `(guestCount, rooms)` for tier-based ones
(The Nest Bologna, referencing an existing `PricingTier`). Validate on
create/update: reject if neither or both are set, reject a `(guestCount,
rooms)` pair that doesn't match an existing `PricingTier` for that property,
reject a `roomId` that doesn't belong to the property.

### Resolution logic (must match `src/lib/api/pricing.ts` exactly — see
"What's already done" below for the client copy)

For each night of a stay: if a `RateOverride` matching that room (or
guestCount/rooms tier) covers that date (`startDate <= date <= endDate`),
use its `pricePerNight` for that night; otherwise use the base rate. Sum
across nights. If an override's own currency/precision matters, `pricePerNight`
should serialize the same way `PricingTier.pricePerNight`/`Room.pricePerNight`
already do (string decimal).

City tax (Bologna) must be recomputed **per night** off that night's
resolved price-per-person, since it can now vary night to night — not one
flat calculation off a single nightly rate like today.

**As always, the server must recompute and charge based on this itself —
never trust a client-sent total.**

### Endpoints

#### `GET /api/properties/:propertyId/rate-overrides`

Public (same pattern as `GET /api/offers`). Returns all of the property's
rate overrides.

#### `POST /api/properties/:propertyId/rate-overrides` (admin: `super_admin` or scoped `villa_manager`)

Body: `{ roomId?, guestCount?, rooms?, startDate, endDate, pricePerNight }` →
`201` with the created `RateOverride`.

#### `PATCH /api/rate-overrides/:id` (admin)

Body: any subset of the create fields → updated `RateOverride`.

#### `DELETE /api/rate-overrides/:id` (admin)

Hard delete — no history concern here (unlike rooms/products), an override
is just a price rule, not something referenced by past bookings.

#### `GET /api/properties/:slug` (existing — extend)

Include a `rateOverrides` array on the response, same pattern as
`pricingTiers`/`rooms` are already embedded there.

### What's already done on the frontend

- `RateOverride`, `CreateRateOverrideInput`, `UpdateRateOverrideInput` types
  and `Property.rateOverrides?` (`src/lib/api/types.ts`).
- `src/lib/api/rate-overrides.ts` — calls the endpoints above (currently
  404s until they exist).
- `src/lib/api/pricing.ts` — `nightlyDateKeys`, `resolveNightlyPriceForRoom`,
  `resolveNightlyPriceForTier` resolve the per-night price described above;
  `computeStayBreakdown`/`computeRoomsStayBreakdown` now iterate per night
  instead of `nights × flatPrice` and accept a `rateOverrides` array.
  `computeCityTax` (flat, unused internally now but kept for any other
  caller) sits alongside a new internal per-night version.
- Admin: a new "Seasonal Pricing" tab
  (`src/components/admin/villa/villa-rate-overrides-tab.tsx`) — a table of
  existing overrides plus a form to add one, switching between a room
  picker (Dona's Villa) or a guests/rooms tier picker (The Nest Bologna)
  depending on which the property uses.
- The public booking flow (`BookingCalendarView`) passes
  `property.rateOverrides ?? []` into the breakdown calls — an empty array
  (property from a not-yet-updated backend) means every night just uses the
  base rate, identical to today's behavior.

### Impact until this ships

`GET .../rate-overrides` 404s → the admin tab shows "Not available yet"
(same pattern as the Offers tab before its endpoint existed) and nothing is
created. `property.rateOverrides` is always absent/empty on the public
site, so every stay prices off the base rate exactly as it does today — no
regression, just missing the new capability.

---

## 2. Date-scoped discounts (`Offer.startDate` / `endDate`)

### The problem

`Offer` (spec'd in the earlier, still-unimplemented `BACKEND_CHANGES.md`)
today is just `{ title, discountPercent, imageUrl, active }` — a single
on/off deal with no date scoping, and its `discountPercent` isn't actually
subtracted from anything; it's purely a marketing card on the homepage. The
ask is for it to actually reduce the accommodation price shown at checkout,
scoped to specific dates, prorated **per night**: only nights whose date
falls inside `[startDate, endDate]` get `discountPercent` off; other nights
of the same stay are charged normally.

### Data model

```
Offer
  ...(existing fields unchanged)
  startDate  date | null   -- new
  endDate    date | null   -- new
```

Both nullable/optional — `null`/absent on either means "no date limit," so
existing offers created before this field existed keep applying whenever
`active: true`, unchanged.

### Resolution logic

For each night of a stay, find every `active: true` offer for that property
whose `[startDate, endDate]` (when set) covers that night's date (an offer
with no dates covers every night). If more than one matches, use the
**highest** `discountPercent` — offers don't stack. Multiply that night's
resolved price (after any `RateOverride`, see §1) by `(1 - discountPercent
/ 100)`.

The server must apply this same per-night discount when computing the
actual charge at `POST /api/bookings` — the frontend's displayed total is a
preview, the backend is the source of truth for what's actually charged,
same as every other price calculation in this API.

### Endpoints

Existing `Offer` CRUD (`GET/POST/PATCH/DELETE /api/offers...`) just needs
`startDate`/`endDate` added to the request/response bodies — no new routes.

### What's already done on the frontend

- `Offer.startDate?`/`endDate?`, `CreateOfferInput.startDate?`/`endDate?`,
  `UpdateOfferInput.startDate?`/`endDate?` (`src/lib/api/types.ts`).
- `src/lib/api/pricing.ts` — `resolveDiscountPercentForNight` (highest
  matching offer's %, per night) folded into `computeStayBreakdown`/
  `computeRoomsStayBreakdown`, which now also return
  `originalAccommodationPrice` (pre-discount), `discountAmount`, and
  `discountPercentApplied` (only set when every night of the stay got the
  same %, so the UI's badge never overstates a partial discount).
- `BookingProvider` fetches `getOffers(property.id)` alongside availability
  and exposes it as `offers` in context.
- `BookingCalendarView`'s price panel shows the pre-discount total struck
  through next to the discounted total in bold, with an "X% OFF" badge,
  whenever `discountAmount > 0`.
- Admin Offers tab (`villa-offers-tab.tsx`) has Starts/Ends date inputs
  (both optional) on the create form and shows the range (or "No date
  range" for legacy offers) on each listed offer.

### Impact until this ships

`Offer` objects just don't carry `startDate`/`endDate` from the backend —
every offer behaves as "no date limit," which for an existing `active`
offer means the discount would apply to every night, not just an intended
window. **Don't mark a new date-scoped offer `active` in the admin panel
until this ships**, or it'll discount every booking instead of just the
intended date range.

---

## 3. Whole-villa locking (supersedes per-room availability)

### This reverses part of `BACKEND_CHANGES_SRI_LANKA_ROOMS.md`

That doc specified **independent per-room availability**: booking 2 of
Dona's Villa's 3 rooms should leave the 3rd room (and the property overall)
bookable by someone else. That's been reconsidered — **only one party
should occupy the villa at a time**. A booking for *any* room (or rooms)
must now block *every* room for those dates, not just the ones actually
reserved.

If the per-room availability endpoints from that doc haven't been built
yet, skip them entirely and implement this section instead — it replaces
that behavior rather than extending it. If they have already been built,
this section describes the change needed on top.

### What changes

- **Availability query**: a date is unavailable for the property (and
  therefore for *every* room on it) if **any** active `AvailabilityBlock`
  overlaps it, regardless of that block's `roomId` — i.e. go back to
  treating the property as a single bookable unit for availability
  purposes, the same as a property with no rooms at all. Do **not**
  compute "blocked only once every room is taken" (that was the old,
  now-superseded rule).
- **Booking validation** (`POST /api/bookings`): reject if *any* existing
  active block on the property overlaps the requested date range,
  regardless of which room(s) it's for or which room(s) are being
  requested. A guest can still pick specific room(s) via `roomIds` (that
  part of the rooms feature is unchanged — it's still recorded on the
  booking, still drives the room-based pricing in §1), but the
  availability check that gates whether the booking can be made at all is
  now whole-property.
- **Block creation on booking**: still create one `AvailabilityBlock` per
  reserved room (as `BACKEND_CHANGES_SRI_LANKA_ROOMS.md` specified) —
  keeping `roomId` on each block is still useful for admin visibility (the
  Blocks tab shows which specific room a block is for). The only actual
  behavior change is that the *availability query* now ORs across all of a
  property's blocks instead of requiring every room to be individually
  blocked.
- Manual admin blocks (`POST .../blocks`) keep working exactly as before —
  an admin can still target one specific room or the whole property; this
  change only affects how availability is *computed* from whatever blocks
  exist, not how blocks are created.

### What's already done on the frontend

- `src/lib/availability.ts` — `buildBlockedDateSetForRooms` no longer
  intersects per-room sets; it now simply returns the whole-property
  blocked-date set (ignoring `roomId` scoping) regardless of how many
  rooms the property has.
- `src/components/booking/booking-provider.tsx` — `roomBlockedDates` (used
  to show each room's own "Booked" badge in the picker) now maps every
  room id to that same whole-property blocked set, so all rooms show
  "Booked" together the instant any one of them is reserved.

### Impact until this ships

If the backend still only rejects a booking when the *specifically
requested* room(s) overlap an existing block (rather than *any* block on
the property), two different guests could both successfully book different
rooms in the villa for overlapping dates — the frontend's calendar would
show the dates as unavailable to the second guest (client-side), but a
direct/racing request could still slip through server-side. Ship the
booking-validation change above before relying on this for a live
property.

---

## 4. Marketplace weight-based shipping

### The problem

Shipping is currently a single flat fee (`FLAT_SHIPPING_FEE = 5`,
`src/lib/marketplace-config.ts`) regardless of what's in the cart. It needs
to instead be calculated from the order's total weight: admin sets a
weight-per-unit on each product, and a price-per-kg table (rates vary by
band, e.g. 1kg costs more per kg than 10kg) from 1kg up to 15kg.

### Data model

```
Product
  ...(existing fields unchanged)
  weightKg  decimal | null   -- new, kg per single unit

ShippingRate
  id            string (pk)
  fromKg        int
  toKg          int
  pricePerKg    decimal
  createdAt     timestamptz
  updatedAt     timestamptz
```

`ShippingRate` is a small, admin-managed global table (not per-product) —
typically 15 rows, one per whole kg from 1 to 15, though the admin can
configure however many bands they want. `weightKg: null`/absent on a
product (e.g. one created before this field existed) is treated as 0kg.

### Fee calculation

`totalWeightKg = Σ(product.weightKg × quantity)` across the order's items,
rounded **up** to the nearest whole kg (minimum 1kg once the cart is
non-empty). Find the `ShippingRate` row where `fromKg <= totalWeightKg <=
toKg`; the fee is `totalWeightKg × that row's pricePerKg`. If the rounded
weight exceeds every configured row's `toKg`, use the highest row's
`pricePerKg` for the excess (there's no data to price heavier orders any
other way until the admin adds more rows) — this is a frontend assumption
(`src/lib/shipping.ts`); confirm/adjust server-side pricing to match
exactly so the checkout preview and the actual charge agree.

As with every other price on this API, **`POST /api/marketplace/orders`
must compute `shippingFee` itself from the submitted `items` and the
current `ShippingRate` table — never trust the client-sent value** (today's
`CreateOrderInput.shippingFee` is client-trusted per `BACKEND_PLAN.md §7`;
this is the point to close that gap now that the fee is meaningful to
manipulate, not just a flat constant).

### Endpoints

#### `GET /api/marketplace/shipping-rates`

Public — checkout needs to price shipping before the customer has any
session.

#### `PUT /api/marketplace/shipping-rates` (admin: `super_admin` or `marketplace_manager`)

Body: `{ rates: [{ fromKg, toKg, pricePerKg }, ...] }` → bulk replace,
same pattern as `PUT /api/properties/:id/pricing-tiers`. Returns the full
updated list.

#### `POST` / `PATCH /api/marketplace/catalog/products` (existing — extend)

Accept `weightKg` in both the create and update bodies; include it on
every returned `Product`.

### What's already done on the frontend

- `Product.weightKg?`, `CreateProductInput.weightKg?`,
  `UpdateProductInput.weightKg?`, `ShippingRate`,
  `UpsertShippingRateInput` (`src/lib/api/types.ts`).
- `src/lib/api/marketplace.ts` — `getShippingRates`, `updateShippingRates`.
- `src/lib/shipping.ts` — `computeShippingFee(rates, totalWeightKg)`, the
  band-lookup logic described above.
- `CartItem` now carries `unitWeightKg` (from `product.weightKg` at
  add-to-cart time) and the cart exposes a derived `totalWeightKg`
  (`src/components/marketplace/cart-provider.tsx`).
- Checkout (`src/pages/sri-lanka/marketplace/checkout/page.tsx`) fetches
  shipping rates on mount and computes the fee from cart weight, falling
  back to `FLAT_SHIPPING_FEE` if the endpoint 404s or returns nothing.
- Admin Products page: a "Shipping Rates" table (1–15kg by default, each
  row's price editable) plus a "Weight per unit (kg)" field on the
  product create/edit forms.

### Impact until this ships

`GET /api/marketplace/shipping-rates` 404s or returns `[]` → checkout keeps
charging the flat `FLAT_SHIPPING_FEE` for every order regardless of weight,
same as today — no regression. The admin's Shipping Rates table still
renders (editable) but `Save` will 404 until the `PUT` endpoint exists.
**Once the endpoints do exist, closing the client-trusted-`shippingFee` gap
on `POST /api/marketplace/orders` (described above) is the important part
— until that ships, a manipulated request could still submit any
`shippingFee` it wants.**

---

## 5. Featured marketplace categories

### The problem

`Category` is currently just `{ id, name, slug }` — no description, no
image, no way to mark any of them as "shown on the storefront's featured
section." That section (`MarketplaceCategories`,
`src/components/sri-lanka/marketplace-categories.tsx`) has always rendered
4 hardcoded categories with hand-written copy; the ask is for an admin to
pick (up to) 4 real categories to feature there instead, each with its own
short description and image.

### Data model

```
Category
  ...(existing fields unchanged)
  description  string | null   -- new, short blurb for the featured section
  imageUrl     string | null   -- new
  featured     boolean default false   -- new
```

**Validation: reject a request that would result in more than 4 categories
with `featured: true`** (across `POST`/`PATCH`) — the frontend also
soft-guards this in the admin UI (disables the checkbox once 4 others are
already featured), but that's advisory only; enforce the actual limit
server-side.

### Endpoints

#### `POST /api/marketplace/catalog/categories` (existing — extend)

Accept `description?`, `imageUrl?`, `featured?` in the body.

#### `PATCH /api/marketplace/catalog/categories/:id` (new — categories have no update endpoint today)

Body: any subset of `{ name, description, imageUrl, featured }` → updated
`Category`. (Admin needed this anyway just to fix a typo — today the only
way to change an existing category's name is delete-and-recreate, which
loses its product associations.)

#### `GET /api/marketplace/catalog/categories` (existing — extend)

Include `description`, `imageUrl`, `featured` on every returned category.
**No filtering change** — this endpoint (and the full marketplace product
listing that uses it) keeps returning every category regardless of
`featured`; that flag only matters to the one homepage section.

### What's already done on the frontend

- `Category.description?`/`imageUrl?`/`featured?`,
  `CreateCategoryInput.description?`/`imageUrl?`/`featured?`,
  `UpdateCategoryInput` (new type) (`src/lib/api/types.ts`).
- `src/lib/api/marketplace.ts` — `updateCategory`.
- Admin Products page: category create form gets a description textarea,
  single-image upload, and a "Featured on homepage (max 4)" checkbox that
  disables itself once 4 others are already featured; each category row
  now has an "Edit" action (new, previously categories couldn't be edited
  at all) using the same fields, plus a "Featured" badge in the table.
- `src/components/sri-lanka/marketplace-categories.tsx` now renders
  whichever (up to 4) categories have `featured: true` — image, name,
  description — instead of the old hardcoded array. It reads off the same
  `MarketplaceProvider` catalog fetch the rest of the marketplace page
  uses (moved inside that provider in
  `src/pages/sri-lanka/marketplace/page.tsx`) rather than fetching
  categories a second time, and clicking a card applies the existing
  category filter (`selectedCategorySlug`) that the Best Products section's
  filter chips already use, then scrolls to it — no new filtering logic,
  just reusing what's there.

### Impact until this ships

`description`/`imageUrl`/`featured` are always absent on every category →
no category is ever `featured`, so `MarketplaceCategories` renders nothing
(the section just disappears — no crash, no hardcoded fallback, since the
whole point is to stop showing made-up placeholder categories). The admin
UI's new description/image/featured fields save fine locally but have
nothing to persist to until `PATCH` exists — `Save`/`Create` will silently
drop those fields if the backend doesn't accept them yet, or 400 if it
validates strictly against an older schema.
