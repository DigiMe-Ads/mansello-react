# Mansello Frontend → Backend: answers and sign-off for the security audit

Reply to `BACKEND_SECURITY_AUDIT.md` (2026-10-05). For each finding marked
**Frontend?** in the audit, this file says:
- what the frontend does today,
- what we've already changed so you can ship your fix, and
- the exact contract we now expect.

**Every frontend change is already merged and works against the current
backend.** Each one tolerates both the before and after shapes, so you can
ship findings in any order without coordinating a release with us.

The short version:

| # | Frontend answer | Go ahead? |
|---|---|---|
| C1 | Frontend never talks to Supabase directly | **Yes, ship now** |
| C2 | Public calendar needs only 3 fields; admin tab now sends its token | **Yes** |
| C3 | Cart now caps at integer 1–99 (and stock) | **Yes** |
| H1 | Admin villa page now sends its token to `GET /api/properties` | **Yes, then rotate the token** |
| H2 | Booking countdown exists; both payment forms now explain an expired hold | **Yes** |
| H3 | No frontend impact | Yes |
| H4 | 60 nights / 18 months agreed; the calendar now enforces 60 nights | **Yes** |
| H5 | Guest form only shows a file name; admin panel refreshes links every 10 min | **Yes** |
| M1 | Admin only offers "Release" on manual blocks already | Yes |
| M2 | Exact request bodies below | **Yes** |
| M4 | Confirmation pages now cope with masked or missing contact fields | **Yes** |
| M6 | Messages are shown as-is; no shape change needed | Yes |
| L3 | Tokens are in `localStorage`. We'd like to defer the cookie move (reasons below) | Discuss |

Everything not listed (H6, M3, M5, M7, M8, L1, L2, L4–L8) is backend-only.
We agree with the proposed order of work.

---

## C1. Supabase RLS: ship it

The frontend **never** uses `supabase-js` and never calls
`*.supabase.co/rest/v1`. `@supabase/*` isn't in `package.json`, and every
data read goes through our API (`NEXT_PUBLIC_API_URL`).

The only thing the browser loads from Supabase is **Storage**: product,
category and room images via
`/storage/v1/object/public/mansello/...`. Enabling RLS on the `public`
schema tables doesn't touch `storage.objects`. Please just **don't change
the image bucket's public setting** as part of this. H5 moves guest
documents to a *separate* private bucket. Product images must stay public.

---

## C2. Availability response shaping

### What the public booking calendar reads

`GET /api/availability/:propertyId?from&to`, from the villa booking pages and
the homepage reservation widget (`src/lib/availability.ts`):

| Field | Used? |
|---|---|
| `startDate`, `endDate` | **Yes** (`YYYY-MM-DD` or ISO, we take the first 10 characters) |
| `status` | **Yes** (only `"active"` blocks count, so keep sending it) |
| `roomId` | No (any block locks the whole villa) |
| `source`, `id`, `bookingId`, `externalUid`, `propertyId`, timestamps | No |

So the public response can be just:

```json
[{ "startDate": "2026-10-14", "endDate": "2026-10-15", "status": "active" }]
```

You can also filter to `status = 'active'` server-side and still send
`status`.

### Admin Calendar & Blocks tab: changed

It used to call the same route **without** a token. It now sends the admin
bearer token (`getAvailabilityAdmin` in `src/lib/api/availability.ts`) on the
**same route**, so use `optionalAuth` as you proposed. With a valid admin
token scoped to that property, it needs:

`id` (for Release), `source`, `roomId`, `startDate`, `endDate`, `status`.

`bookingId` and `externalUid` are no longer read anywhere. We removed the
`externalUid` Booking.com-label stopgap, since every Booking.com row is now
`source = booking_com`. Include them for admins or not, as you prefer.

---

## C3. Order validation: ship it

Your schema matches what the cart sends:

```ts
POST /api/marketplace/orders
{
  customerName: string,
  customerPhone: string,
  deliveryAddress: string,
  notes?: string,
  shippingFee: number,                     // see note
  items: { productId: string /* uuid */, quantity: number }[]
}
```

- **Quantities:** always positive integers. The cart now clamps every line to
  `min(99, quantityOnHand)` (`MAX_CART_QUANTITY` in `cart-provider.tsx`), so
  1–99 is safe. `productId`s are unique per order, because the cart merges
  duplicates.
- **409 on insufficient stock:** handled. The checkout shows your `message`,
  so please make it name the product, e.g. *"Only 2 × Ceylon Cinnamon left —
  please update your cart."*
- **Paid order that can't be fulfilled:** we suggest **auto-refund**, with an
  email, over backorder. There's no backorder UI or messaging anywhere.
- **Shipping fee (an extra issue we found):** the frontend still sends
  `shippingFee`, and the backend has historically **trusted it**
  (`src/lib/marketplace-config.ts` says so). That's the same class of bug as
  C3: a customer can send `shippingFee: 0`. Please compute shipping
  server-side from the shipping-rate bands and the items' `weightKg`. The rule
  is in `src/lib/shipping.ts`: round total weight **up** to the next whole kg,
  charge that band's flat price, use the last band above the top, and fall
  back to a flat `5` if every band is 0. Then ignore the client value. We'll
  keep sending it for now so nothing breaks, so tell us when we can drop it.

---

## H1. Property secrets: ship it, then rotate

- **Public** `GET /api/properties` and `GET /api/properties/:slug` can drop
  `icalExportToken`, `airbnbIcalImportUrls` and `icalImportStatus`. No public
  page reads them. The public pages only use `id`, `name`, `slug`, pricing,
  rooms, `minNights`, `maxGuests`, `currency`, `stripeAccountRef`, the
  transport and city-tax fields, and so on. Nothing secret.
- **Admin:** we chose the token option. The villa admin detail page now calls
  the **same** `GET /api/properties` list **with** the admin bearer token
  (`getPropertiesAdmin`). When a token is present, return the three fields for
  the properties that admin is scoped to. No new route is needed.
- The Settings tab now copes with the fields being missing. It shows an empty
  import list and a "link not available" note instead of crashing, so you can
  ship the stripping before or after we deploy.
- `PATCH /api/properties/:id` keeps accepting `airbnbIcalImportUrls`. We still
  send that name, as before.
- **After deploying, please regenerate `icalExportToken`** and tell us. The
  client then needs to re-paste the new export URL (shown in Villa admin →
  Settings → "Our Export Feed") into Airbnb and Booking.com. We'll walk them
  through it.

`icalImportStatus` isn't displayed yet. Send us its shape and we'll show the
last-sync time and any error under the import URLs.

---

## H2. Late payments after a hold expired: ship it

- **Bookings:** the payment step already shows a live "Hold expires in
  mm:ss" countdown from `booking.expiresAt`, and swaps to "Your hold expired,
  start again" at zero. Keep `expiresAt` on the `POST /api/bookings`
  response.
- **New:** if the guest submits anyway (e.g. a laptop woke from sleep after
  expiry), Stripe returns `payment_intent_unexpected_state` once you've
  cancelled the PaymentIntent. Both the booking and marketplace payment forms
  now catch that code and say the hold or order expired and **no payment was
  taken**.
- **Marketplace orders** have no countdown, since the 24-hour expiry is long
  enough not to need one. If you'd prefer a shorter order expiry, add
  `expiresAt` to the `Order` response and we'll show the same countdown.
- **Webhook backstop:** agreed. Re-confirm if still free, otherwise refund
  automatically and email the customer. There's no frontend part.

---

## H4. Booking limits: ship it

| Limit | Your proposal | Frontend today | OK? |
|---|---|---|---|
| Past check-in | reject | Past days already disabled in the calendar | ✅ |
| Max stay | 60 nights | **Now enforced**: "Maximum stay is 60 nights — please contact us for longer stays" (`MAX_STAY_NIGHTS` in `src/lib/availability.ts`) | ✅ |
| Advance window | 18 months | Calendar shows ~11 months ahead and loads 372 days of availability | ✅ (stricter) |
| Rate limit | ~10 / 10 min / IP | A normal guest makes 1–3 attempts | ✅ |

Notes:
- **"Today" in the property's timezone:** the calendar uses the browser's
  local date. A guest abroad near midnight could pick a check-in the server
  considers "yesterday". The 400 message is shown as-is, so please make it
  clear (*"Check-in can't be in the past"*).
- **Rate-limit 429:** return the usual `{ message }`. It's shown on the guest
  details step.
- **Admin offline bookings** (`POST /api/bookings/offline`) should probably
  **keep** allowing past dates (recording a stay after the fact) and stays
  over 60 nights. Please apply the new checks only to the public route.
- If you change 60 or 18, tell us, so `MAX_STAY_NIGHTS` matches.

---

## H5. Private guest-documents bucket: ship it

**What the guest form does with `urls`** (`file-upload-field.tsx`):
- It does **not** preview, display or fetch them.
- It shows only the last path segment as a file name, and lets the guest
  remove an entry.
- On submit it sends the strings back unchanged inside
  `answers[fieldId]: string[]`.

So the upload endpoint can return **opaque storage keys** instead of URLs,
keeping the same response shape:

```json
POST /api/booking-info-requests/:token/uploads  →  { "urls": ["guest-documents/3f2c…-passport.jpg"] }
```

The field name `urls` is kept to avoid a breaking change. The file-name
display now handles keys as well as URLs. **On submit, validate that every
file answer is a key you issued for *this* token** (that also closes the M2
"planted link" point).

**Admin view** (`guest-info-request-panel.tsx`): file answers are rendered as
plain `<a href={value} target="_blank">Document N</a>` links. The simplest
contract is **no new endpoint**: in the admin
`GET /api/bookings/:bookingId/info-requests` response, replace each stored key
in `answers` with a **signed URL** (15 min), leaving everything else as-is.
The panel now re-fetches every 10 minutes while open, so links don't go stale.

Please migrate the existing public documents and delete the public copies. We
agree with the retention rule. 30 days after checkout seems reasonable; it's
the client's call.

---

## M2. Exact request bodies (for your zod schemas)

All JSON. Fields with `?` are optional and **omitted** when empty, never sent
as `""`. Unknown keys are never sent, so stripping them is safe.

```ts
// POST /api/leads/contact   (Italy + Sri Lanka contact forms)
{ site: "italy" | "sri_lanka",
  name: string, email: string,
  subject: "room_booking" | "airport_transfer" | "tour_package" | "marketplace" | "other",
  message: string }

// POST /api/leads/transport-requests
{ propertyId?: string,      // uuid
  bookingId?: string,       // uuid. ONLY sent by the booking flow, right after
                            // POST /api/bookings succeeds, for that new booking
  type: "fixed_price" | "custom_quote",
  date: string,             // YYYY-MM-DD
  flightNumber?: string,
  passengers: number,       // integer ≥ 1
  contactName: string, contactEmail: string, contactPhone: string,
  notes?: string }

// POST /api/leads/custom-orders   (marketplace "can't find it" form)
{ site: "italy" | "sri_lanka", name: string, email: string, itemDescription: string, notes?: string }

// POST /api/leads/newsletter
{ email: string, site: "italy" | "sri_lanka" }

// POST /api/booking-info-requests/:token/submit
{ answers: Record<fieldId, string | boolean | string[]> }   // string[] only for "file" fields
```

For `transport-requests.bookingId`: since we only ever send it for a booking
created seconds earlier, please validate that:
- the booking exists;
- it belongs to `propertyId`;
- it is `pending_payment` or `confirmed`;
- `contactEmail` matches its `guestEmail`.

Reject otherwise. Don't strip the field, because it's how the transfer add-on
links to the booking.

Admin bodies (products, categories, pricing tiers, stock adjustment, order
status, users) are in `src/lib/api/types.ts` (`Create*Input` /
`Update*Input`). Two details you'll hit:
- `UpdateCategoryInput.parentId` may be **`null`** (meaning "move back to top
  level"), so allow `null`, not just `string | undefined`.
- `description` on products is a sanitized **HTML string**. Validate the
  length (~10k) and sanitize as specified in
  `BACKEND_CHANGES_PRODUCT_DETAILS_SUBCATEGORIES_ICAL.md`. Don't reject it for
  containing `<`.

---

## M4. Public booking and order lookups: ship it

What the pages actually render:

**`GET /api/bookings/:id`** (booking confirmation page and the payment-status
poll):

`id, status, checkIn, checkOut, guests, currency, accommodationPrice,
cityTax, transportPrice, totalPrice`

…and `guestEmail`, for "A confirmation has been sent to …". You can **mask
it** (`c•••@gmail.com`) or **drop it**. The page now says "…sent to your
email address" when it's missing. `guestName`, `guestPhone`, the ID document
and `stripePaymentIntentId` aren't used.

**`GET /api/marketplace/orders/:id`** (order confirmation page):

`id, status, items[].{id, productNameSnapshot, quantity, lineTotal},
shippingFee, total`

…plus `customerName` ("Thank you, Nadia!") and `customerPhone` ("We'll call
… if we need anything"). Please return the **first name only** and a
**masked phone** (`•••• 4521`). Both pages now cope with either being missing.
`deliveryAddress` and `notes` aren't used. Drop them.

**We prefer response shaping over a second factor or signed URL token.** The
confirmation URLs come back from Stripe's redirect
(`?bookingId=…` / `/order/:id`), and adding a signed token there is more
moving parts for little gain once the response holds nothing sensitive. If you
do add a token later, put it in the query string and we'll pass it through.

---

## M1 / M6: confirmations

- **M1:** the admin blocks list only shows **Release** on `source = manual`
  rows. Restricting `DELETE /api/availability/blocks/:id` to manual blocks
  server-side matches the UI exactly. Leads visible to all admin roles is
  intended.
- **M6:** every admin and public form shows the error response's `message`
  (falling back to `error`). 404/409/400 with a human-readable `message` is
  all we need. No shape change. One dependency to keep: the product **delete**
  button treats **409** as "has order history → offer Deactivate instead".
  Keep 409 for that case.

---

## L3. Admin tokens in `localStorage`: defer, please

The access and refresh tokens are kept in `localStorage`
(`admin-auth-provider.tsx`). Moving the refresh token to an `httpOnly` cookie
is the right long-term step, but it isn't a small change here:
- The frontend and API are on different origins, so it needs
  `SameSite=None; Secure` cookies, `credentials: "include"` on every admin
  call, `Access-Control-Allow-Credentials` with an exact-origin CORS list, and
  CSRF protection on the refresh and logout routes.
- Our XSS surface is small. React escapes output everywhere, and the only HTML
  we inject (product descriptions) goes through a strict tag whitelist with
  no attributes.

We suggest doing it as its own piece of work after the items above. If you
agree, we'll spec it together.

---

## Frontend changes made for this audit (for reference)

| Finding | File(s) |
|---|---|
| C2 | `src/lib/api/availability.ts` (`getAvailabilityAdmin`), `villa-blocks-tab.tsx` |
| C3 | `cart-provider.tsx` (`MAX_CART_QUANTITY` = 99, integer clamp), `product-detail-dialog.tsx` |
| H1 | `src/lib/api/properties.ts` (`getPropertiesAdmin`), `villas/[propertyId]/page.tsx`, `villa-settings-tab.tsx`, `Property` type (secrets now optional) |
| H2 | `payment-step.tsx`, `checkout-payment-step.tsx` (`payment_intent_unexpected_state` message) |
| H4 | `src/lib/availability.ts` (`MAX_STAY_NIGHTS` = 60), `booking-calendar-view.tsx`, `reservation-widget.tsx` |
| H5 | `file-upload-field.tsx` (keys as file names), `guest-info-request-panel.tsx` (10-minute link refresh) |
| M4 | `booking-confirmation-content.tsx`, `order/[id]/order-confirmation-content.tsx` |
