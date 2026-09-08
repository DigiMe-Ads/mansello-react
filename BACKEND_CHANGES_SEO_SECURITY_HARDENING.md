# Mansello Frontend → Backend: SEO & security hardening pass

Written after a full-site SEO, security, and functionality sweep. The
frontend side of that work is **already done and merged into the working
tree** — this file covers only the parts that cannot be fixed from the
browser.

Sections 1–3 are **created by frontend changes that have already shipped**:
something on the backend now has to change, or move, to match. Sections 4–5
are new asks that the frontend work exposed. Section 6 lists security
findings from the same sweep that were always backend-side — they are not
caused by this pass, but they were found during it and belong in one place.

Nothing here blocks a deploy. Section 1 is the only item with a live data
exposure attached to it.

---

## 1. Purge leaked guest tokens from `click_events`, and stop accepting them

**Priority: do this first. There is guest data in the analytics table right now.**

### The problem

`src/lib/analytics/click-tracker.ts` recorded `window.location.pathname`
verbatim on every click, on every public page. Two of those routes carry a
secret in the path itself:

- `/booking-info/<token>` — that token is the **only** credential guarding
  the page. It shows the guest's name, property and dates, and it accepts
  **passport-scan uploads** (`POST /api/booking-info-requests/:token/uploads`).
- `/sri-lanka/marketplace/order/<id>` — identifies a customer's order, which
  `GET /api/marketplace/orders/:id` will return in full, unauthenticated.

Every click a guest made on their booking-info page therefore POSTed their
token to `POST /api/analytics/click-events` — a **public, unauthenticated**
endpoint — where it was stored. Anyone with read access to that table, or
any path that echoes it back (see 1.4), holds working credentials to another
guest's identity documents.

`siteFor()` already returned `null` for these paths, but `path` was captured
regardless, so the guard never actually stopped the write.

### 1.1 — Already fixed on the frontend

The tracker now drops any event whose path is not in the static
`KNOWN_PAGES` allowlist (`src/components/admin/heatmap/known-pages.ts`) —
the same ~16 static public pages the heatmap can render anyway. No heatmap
functionality is lost; dynamic routes were never renderable.

### 1.2 — Backend: delete the existing rows

```sql
-- Inspect first, so you know what was exposed and for how long.
select path, count(*), min(occurred_at), max(occurred_at)
from click_events
where path like '/booking-info/%'
   or path like '/sri-lanka/marketplace/order/%'
group by path;

-- Then delete. These rows cannot be anonymised — the secret *is* the path.
delete from click_events
where path like '/booking-info/%'
   or path like '/sri-lanka/marketplace/order/%';
```

Also purge them from any analytics backup, replica, or log-shipping sink
that mirrors this table.

**Treat the affected `booking_info_request` tokens as compromised** and
reissue them. How far to go depends on who has had read access to the
analytics store; if that is only your own team, rotation is a precaution
rather than an incident.

### 1.3 — Backend: enforce the allowlist server-side too

The client-side allowlist protects real guests, but the endpoint is
unauthenticated: anyone can still POST arbitrary `path` values directly.
Reject at write time rather than storing and filtering later.

```
POST /api/analytics/click-events
```

- Reject (or drop silently, matching the endpoint's existing fire-and-forget
  contract) any event whose `path` is not in the server's copy of the
  allowlist.
- At minimum, reject any `path` matching `/booking-info/%`, `/admin%`, or
  `/sri-lanka/marketplace/order/%`.
- Cap `path` length and reject anything containing `?`, `#`, `@`, `\` or a
  URL scheme — see 1.4 for why `@` specifically matters.

### 1.4 — Backend: `GET /api/analytics/pages` should return allowlisted paths only

`BACKEND_CHANGES_HEATMAP_ANALYTICS.md` currently says this endpoint should
"return every path seen so far, not just the seven or so 'known' ones the
frontend's dropdown currently hardcodes." **That guidance is now wrong** and
should be treated as superseded by this file: returning every path seen
would surface purged and attacker-supplied paths back into the admin UI.

There is a latent injection here worth recording. `heatmap-viewer.tsx:278`
builds an iframe src as:

```js
src={`${window.location.origin}${path}`}
```

Today `path` comes only from the hardcoded `KNOWN_PAGES` array, so this is
safe. But if that dropdown is ever wired to server-returned paths, a stored
`path` of `@evil.com/x` yields `https://mansello.com@evil.com/x`, which
browsers parse as host `evil.com` — an attacker-controlled frame inside the
admin dashboard. Validating `path` on write (1.3) closes this off before it
can ever be reached.

---

## 2. `shippingFee` — recompute server-side, and match the new band logic

### 2.1 — The existing requirement still stands

`BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md` §313–318 and §362–365
already specify that `POST /api/marketplace/orders` must compute
`shippingFee` itself and **never trust the client-sent value**. That is not
yet implemented, and `src/lib/marketplace-config.ts` still documents the
backend as trusting it.

Until it is, a tampered request can set `shippingFee` to a negative number
and reduce the amount the PaymentIntent is created for. The `items` array is
fine — it carries only `{productId, quantity}`, so unit prices are already
server-authoritative. **Shipping is the only client-controlled money in the
checkout.**

The frontend can keep sending the field; it should simply be ignored. That
keeps the checkout preview rendering exactly as it does today.

### 2.2 — New: the server's algorithm must match the corrected client one

The client's `computeShippingFee` (`src/lib/shipping.ts`) had a bug that has
now been fixed, and **the server's implementation must reproduce the fixed
behaviour, not the original**. If the two disagree, the total quoted in the
Order Summary will not match the amount charged.

Two rules changed:

**(a) Weights that fall in a gap between bands.** With bands of `1–3kg` and
`6–10kg`, a 4kg order previously matched no band, was not above the top
band's ceiling, and fell through to `sorted[0].pricePerKg` — **the cheapest
rate configured**. Since admins configure bands freely via
`updateShippingRates`, a gap is a realistic data-entry outcome, and the
result was systematic undercharging on heavier orders.

Now: charge the nearest band **at or below** the weight.

**(b) Identifying the top band.** Bands are sorted by `fromKg`, so the last
entry is the one that *starts* highest — not necessarily the one that *ends*
highest. With overlapping bands the "is this above the top band?" check was
comparing against the wrong ceiling.

Now: pick the top band by `max(toKg)`.

Reference implementation, in evaluation order:

```
roundedKg = max(1, ceil(totalWeightKg))
if no rates, or totalWeightKg <= 0       -> 0

1. band where roundedKg is between fromKg and toKg (inclusive)
                                         -> roundedKg * band.pricePerKg
2. top = band with the highest toKg
   if roundedKg > top.toKg               -> roundedKg * top.pricePerKg
3. gap: nearest band with toKg < roundedKg, choosing the highest such toKg
                                         -> roundedKg * nearest.pricePerKg
4. below the lowest band                 -> roundedKg * lowestBand.pricePerKg
```

Weight is rounded **up** to the next whole kg before any band matching.

The cleanest long-term fix is to stop duplicating this logic: have the order
endpoint return the computed `shippingFee` and have the checkout render that
instead of its own preview. Worth considering if the band rules grow.

---

## 3. Every endpoint must respond within 30 seconds

### The problem

There was no timeout on any request in the app — `src/lib/api/client.ts` was
a bare `fetch`. On a stalled connection the promise never settled, so the
`finally` that re-enables a submit button never ran: every form in the app
(contact, newsletter, transport enquiry, checkout, admin login, all admin
CRUD, guest info upload) would sit on "Sending…" forever with no error and
no way to retry short of a page reload.

### What changed

`apiFetch` now applies `AbortSignal.timeout(30000)`, combined with any
caller-supplied signal via `AbortSignal.any` so cancel-on-unmount still
works. A timeout surfaces as a normal `ApiRequestError`:

```
status 408, code "request_timeout"
```

which every existing error UI already renders.

### What the backend needs to do

Any endpoint that can legitimately exceed 30 seconds will now be aborted
client-side, and the user will see a timeout message even though the work may
still complete server-side. Audit for:

- **Image uploads** — `POST /api/uploads/images` and
  `POST /api/marketplace/catalog/products/images`, especially large phone
  photos on a slow connection.
- **Guest document uploads** — `POST /api/booking-info-requests/:token/uploads`
  (passport scans, often multi-MB, often on hotel wifi).
- **Any bulk or report query** in the admin panel.
- **iCal sync**, if it is ever triggered synchronously from a request.

Anything that cannot meet 30s should return `202` and expose a status
endpoint to poll, rather than holding the connection open. If you would
prefer a different ceiling, it is a single constant — `REQUEST_TIMEOUT_MS` in
`src/lib/api/client.ts`.

**Non-idempotent endpoints matter here.** A client-side abort does not stop
the server. If `POST /api/marketplace/orders` takes 31 seconds, the customer
sees a timeout, retries, and you get two orders. Accepting an idempotency key
on order and booking creation would close that off.

---

## 4. Blog posts are missing from `sitemap.xml`

A `sitemap.xml` now exists at `public/sitemap.xml` (30 URLs) and is
referenced from `robots.txt`. It covers all static routes, the 10 destination
pages, and the 3 tour packages — every route whose data lives in the bundle.

**Blog posts are not in it**, because they come from the API and cannot be
enumerated at build time. They are the site's only regularly-growing content,
so this is the gap that matters most for indexing.

Three options, cheapest first:

1. **Build-time fetch.** A prebuild script calls
   `GET /api/blog/posts?site=…` and writes the entries into
   `public/sitemap.xml`. No backend work at all, but the sitemap is only as
   fresh as the last deploy.
2. **Server-generated sitemap.** Serve `/sitemap.xml` (or a second
   `/sitemap-blog.xml` referenced from a sitemap index) from the backend,
   built from published posts. Needs a host/proxy rule so the path resolves
   to the API rather than the static bundle.
3. **Ping on publish.** Keep the static sitemap and have the backend submit
   new post URLs to search engines when a post is published.

For options 1 and 2, `GET /api/blog/posts?site=…` already returns everything
needed (`slug`, `publishedAt`, `updatedAt`) — no new endpoint required.
Please make sure `updatedAt` is genuinely maintained on edit, since it
becomes the `<lastmod>` value.

---

## 5. Two config values are now pinned in the frontend

### 5.1 — CSP pins the API origin

`public/.htaccess` now ships a Content-Security-Policy whose `connect-src`
names the backend origin explicitly:

```
connect-src 'self' https://mansello-backend-production.up.railway.app
            https://api.stripe.com https://m.stripe.network;
```

It is deployed as **`Content-Security-Policy-Report-Only`**, so nothing is
blocked today. Before switching it to the enforcing header:

- Load `/sri-lanka/marketplace/checkout` and `/admin/heatmap` and confirm the
  browser console is clean.
- **If the backend origin ever changes** — a staging backend, a custom API
  domain, a move off Railway — that line must change with it, or every API
  call fails with correct-looking code. Flagging it here because the symptom
  is confusing and the cause sits in a file backend work rarely touches.

Two directives are deliberate and should not be "tightened": `frame-ancestors
'self'` (the admin heatmap frames the site's own pages — `'none'` breaks that
panel) and `payment=(self "https://js.stripe.com")` in Permissions-Policy
(required for Apple Pay / Google Pay inside Stripe's PaymentElement).

### 5.2 — The API must stay on HTTPS

`getBaseUrl()` now throws unless `VITE_API_URL` starts with `https://`
(localhost is exempt for local dev). Previously an `http://` value would have
silently shipped guest PII and admin bearer tokens in plaintext. Railway is
already HTTPS, so this changes nothing today — it just makes a future
misconfiguration fail loudly at startup instead of quietly in transit.

While you are in there: **CORS on the Railway backend should be restricted to
`https://mansello.com`**, not `*`. I could not verify the current setting
from the frontend.

---

## 6. Backend security items found during the sweep

Not caused by the frontend changes above — these were always server-side, and
none can be verified from the browser. Listed so they are recorded somewhere.
Each is a specific yes/no question.

1. **Per-endpoint role enforcement.** `RequireAdmin` reads `admin.role`
   straight back out of `localStorage` on reload, so a `villa_manager` can
   edit that value to `super_admin` and see every gated screen. Their JWT is
   unchanged, so this is only cosmetic **if** the server checks the role claim
   on every endpoint. Test: authenticate as `villa_manager`, then call
   `POST /api/admin/users`, `POST /api/blog/posts`, `PUT /api/testimonials`,
   `GET /api/analytics/heatmap`, `PUT /api/marketplace/shipping-rates`. All
   five must return 403.

2. **ID entropy on unauthenticated reads.** `GET /api/bookings/:id`,
   `GET /api/marketplace/orders/:id` and
   `GET /api/booking-info-requests/:token` are public and return substantial
   PII. If those identifiers are sequential or short, the whole guest list is
   walkable. They should be UUIDv4 / ≥128-bit CSPRNG. Separately:
   `GET /api/bookings/:id` appears to return `guestIdDocumentNumber` — a
   **passport number, to an unauthenticated caller**. That field should be
   stripped from public reads regardless of ID entropy.

3. **Stripe webhook signature verification.** Whatever endpoint flips an order
   or booking to `confirmed` must verify the `whsec_` signature. If it does
   not, a forged payment-success callback gets goods and stays for free.

4. **Rate limiting** on the public POST endpoints — `/api/leads/*`,
   `/api/marketplace/orders`, `/api/analytics/click-events`,
   `/api/booking-info-requests/:token/uploads`, and especially
   `/api/admin/login` (lockout/backoff against credential stuffing). There is
   no captcha or honeypot anywhere on the frontend, by design — a visible
   captcha was out of scope for this pass.

5. **Upload hardening** for the three upload endpoints: verify content type by
   magic bytes rather than the client-sent header, cap size and count, and
   sanitise filenames. The frontend's `accept="image/jpeg,image/png,image/webp"`
   is a file-picker filter, not validation — drag-and-drop bypasses it
   entirely. Serve uploads from a separate origin, or with
   `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
   The guest-facing one is unauthenticated and receives passport scans, so it
   needs the most scrutiny.

6. **Add `POST /api/admin/logout`.** Refresh tokens are stored in
   `localStorage` and the frontend's `logout()` only clears local state — the
   refresh token stays valid server-side until it expires. There is currently
   no way for an admin to revoke a session. (Moving the refresh token to an
   `HttpOnly; Secure; SameSite=Lax` cookie is the better fix, but it changes
   session-persistence behaviour and needs a coordinated frontend change.)

7. **Error messages are rendered verbatim.** `client.ts` puts `body.message`
   straight into the UI, so anything the backend returns there is shown to the
   user. Confirm production responses carry no stack traces or SQL.

---

## Frontend work already completed — no backend action needed

Recorded so nobody re-opens these:

- Per-route titles, descriptions, canonicals, OG/Twitter tags across all 30
  routes; JSON-LD for `Organization`, `LodgingBusiness`, `BlogPosting`,
  `TouristDestination`, `TouristTrip`, `BreadcrumbList`.
- `robots.txt` and `sitemap.xml` added; `noindex` on all admin, checkout,
  cart, order, booking-info and confirmation routes.
- Full security-header set in `.htaccess` (HSTS, nosniff, frame options,
  Referrer-Policy, Permissions-Policy, CSP report-only), HTTPS redirect,
  dotfile deny, directory listing disabled.
- Cache-Control corrected: `/images/**` was being served `immutable` for a
  year despite having no content hash, so replacing a photo was invisible to
  returning visitors with no way to force a refresh.
- Admin panel split out of the public bundle (653 KB → 549 KB entry chunk).
- Typecheck was failing and had been shipping silently, because `build` never
  ran `tsc`. Fixed, and `build` is now `tsc --noEmit && vite build`.
- Fixed: `€NaN` on the payment screen; silent failures on admin testimonial
  toggle/delete; a testimonials filter race; duplicate React keys; a timer
  firing after unmount; two hazardous image filenames (a space in a live URL,
  and an uppercase name that would 404 on Linux hosting).

## Known frontend issues deliberately left alone

Both need a product decision, not a backend one:

- **Testimonials will disappear from both homepages on deploy.** Uncommitted
  work replaced six hardcoded reviews with a DB-only read whose endpoint does
  not exist yet (`BACKEND_CHANGES_TESTIMONIALS.md`), and the failure path is
  `return null` — no error, no log, no visible symptom. Either ship that
  endpoint before deploying, or restore a hardcoded fallback.
- **Marketplace 3-D Secure is broken.** `redirect: "if_required"` navigates
  the browser away for cards that need bank authentication, so the cart is
  never cleared and the confirmation page shows "Your payment was successful
  and your order is confirmed" without checking `order.status` — including
  after a **failed** challenge. The villa booking flow handles this correctly
  by putting the id in the `return_url` and polling; the marketplace flow has
  no equivalent.
