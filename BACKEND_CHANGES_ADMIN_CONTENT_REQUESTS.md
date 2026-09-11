# Mansello Frontend → Backend: marketplace custom orders, max guests, villa transport toggle

Covers the backend work behind four related frontend changes shipped
together. Three of the four need a backend change; one doesn't.

1. **Marketplace custom item requests** (Sri Lanka) — needs a new table + 3
   endpoints. See §1.
2. **Admin-editable `maxGuests`** — needs one existing endpoint to accept one
   more field. See §2.
3. **Villa transport master on/off switch** — already fully spec'd in
   **`BACKEND_CHANGES_VILLA_TRANSPORT.md`** (updated alongside this doc); not
   repeated here.
4. **Villa photos editable from the Content admin tab** — **no backend change
   needed.** The content endpoints (`BACKEND_CHANGES_SITE_CONTENT.md`) already
   store arbitrary `key -> value` pairs; the frontend just registered more
   keys in `src/lib/content/schema.ts`. Once that endpoint exists, these
   fields work automatically.
5. **Removed the "Flat-Rate Transfer / Custom Quote" dropdown** from the
   transport request form — frontend-only cleanup. The form still sends the
   same `type` field to `POST /api/leads/transport-requests` (now inferred
   from context instead of asked), so nothing here changes either.

---

## 1. Marketplace custom item requests

### What this is

A "can't find it in the catalog?" form on the Sri Lanka marketplace page.
Guest enters their name, email, and a description of the item they want
(brand, size, quantity, etc.), plus optional notes. We get back to them with a
price — this is a lead/enquiry, **not a purchase**: no price is quoted or
charged at submission, nothing touches the cart or checkout.

Frontend: `src/components/sri-lanka/custom-item-request.tsx`, submitted via
`src/lib/api/leads.ts` (`submitCustomOrderRequest`). Shown at the bottom of
`/sri-lanka/marketplace`.

### New `custom_order_requests` table

```sql
create table custom_order_requests (
  id                uuid primary key default gen_random_uuid(),
  site              text not null default 'sri_lanka' check (site in ('italy', 'sri_lanka')),
  name              text not null,
  email             text not null,
  item_description  text not null,
  notes             text,
  status            text not null default 'new' check (status in ('new', 'read', 'responded')),
  created_at        timestamptz not null default now()
);
```

Same shape as the existing `contact_messages` / `transport_requests` tables —
`site` is included for consistency with those (and in case the marketplace
ever serves Italy too), even though every request today will carry
`sri_lanka`.

### Endpoints

Follow the exact pattern already established for transport requests
(`BACKEND_CHANGES.md` / the live `/api/leads/transport-requests` routes) —
same auth model, same response shape, same status lifecycle.

#### `POST /api/leads/custom-orders` — public

```json
// Request
{
  "site": "sri_lanka",
  "name": "Priya Fernando",
  "email": "priya@example.com",
  "itemDescription": "Ferrero Rocher, 24-count box, x3",
  "notes": "Needed before the 20th if possible"
}
```

```json
// Response — 201
{
  "id": "...",
  "site": "sri_lanka",
  "name": "Priya Fernando",
  "email": "priya@example.com",
  "itemDescription": "Ferrero Rocher, 24-count box, x3",
  "notes": "Needed before the 20th if possible",
  "status": "new",
  "createdAt": "2026-09-10T12:00:00Z"
}
```

`notes` is optional — omit or send `null`. Validate `name`, `email`
(well-formed), and `itemDescription` as required, non-empty strings.

#### `GET /api/leads/custom-orders` — admin

Roles: `super_admin`, `marketplace_manager` (matching whoever can already see
`GET /api/leads/transport-requests`). Optional `?status=` filter
(`new` | `read` | `responded`). Returns newest first, same list shape as the
POST response.

#### `PATCH /api/leads/custom-orders/:id/status` — admin

```json
{ "status": "read" }
```

Returns the updated record. Same roles as the list endpoint.

### Frontend already wired for this

- `src/lib/api/types.ts` — `CustomOrderRequest`, `CreateCustomOrderRequestInput`.
- `src/lib/api/leads.ts` — `submitCustomOrderRequest`,
  `listCustomOrderRequests`, `updateCustomOrderRequestStatus`.
- `src/pages/admin/(protected)/leads/page.tsx` — new "Custom Item Requests"
  tab, listing requests with Mark Read / Mark Responded actions, same as the
  Contact Messages and Transport Requests tabs. Shows a 404-safe notice
  ("Not available yet...") until this ships, same pattern as the rest of the
  Leads page.
- The public form's inputs all carry real `id`/`name`/`autoComplete`
  attributes (`name`, `email`, `itemDescription`, `notes`) rather than being
  identified by placeholder text alone.

Until the endpoint exists, submitting the form surfaces the normal
`ApiRequestError` (404) as an inline error — it fails safely, nothing is lost
silently.

---

## 2. Admin-editable `maxGuests`

### What this is

`Property.maxGuests` already exists on the API response and is shown
read-only on the admin villas list (`Min nights: 3 · Max guests: 6`), but
there has never been a way to *change* it from the admin — it's presumably
been backend/seed-data only until now.

The villa admin's **Settings** tab now has a "Max Guests" field alongside the
existing Min Nights / Turnover Buffer / Check-in / Check-out fields, saved
through the same form.

**Action needed on data, not just code:** once this field is editable,
please set **Dona's Villa's `maxGuests` to `8`** (it currently sleeps up to 8
across its rooms per the existing room-capacity data, but the property-level
cap hasn't been kept in sync) — either directly, or the client can now do it
themselves from Settings once this ships.

### Endpoint change

`PATCH /api/properties/:propertyId` already accepts `minNights`,
`turnoverBufferDays`, `checkInTime`, `checkOutTime`, `airbnbIcalImportUrls`.
Add one more optional field to that same endpoint:

```diff
 {
   minNights?: number,
   turnoverBufferDays?: number,
   checkInTime?: string,
   checkOutTime?: string,
   airbnbIcalImportUrls?: string[],
+  maxGuests?: number
 }
```

Validate `maxGuests` as a positive integer. Whether it should be constrained
against the property's rooms/pricing tiers (e.g. not set below the largest
configured tier) is a judgment call for whoever owns that endpoint — the
frontend doesn't enforce a relationship between the two today.

No new route, no new table — same roles as the rest of that endpoint
(`super_admin`, `villa_manager` scoped to their property).

### Frontend already wired for this

- `src/lib/api/types.ts` — `UpdatePropertyInput.maxGuests`.
- `src/components/admin/villa/villa-settings-tab.tsx` — new "Max Guests"
  field, saved together with the rest of the Settings form.

Saving before the backend accepts the field is harmless — the extra key is
either ignored or (once implemented) applied; either way the rest of the
Settings save still goes through.
