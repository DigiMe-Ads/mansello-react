# Mansello Frontend → Backend: product variations, booked nights on the pricing calendar, Payments.lk for Sri Lanka

Three changes. The frontend for all of them is **done and merged**. Each one
works against today's backend and switches on as each backend piece ships:
- Products without variations behave exactly as before.
- The calendar shows bookings with what the API already returns.
- Bookings and orders keep using Stripe until the backend starts returning a
  Payments.lk `checkoutUrl`.

| # | Change | Backend work | Size |
|---|---|---|---|
| 1 | Product variations (e.g. 80ml / 100ml), each with its own SKU, price, weight and stock | New table, 4 admin endpoints, changes to catalog, orders, stock and low-stock | Medium |
| 2 | Seasonal Pricing calendar shows existing bookings | **None.** Confirm two response details (§2) | Check only |
| 3 | Payments.lk replaces Stripe for **Sri Lanka only** (villa bookings and marketplace orders). Italy stays on Stripe | Checkout creation, webhook, cancel route, LKR conversion, refunds | Large |

---

## 1. Product variations

### What the admin can now do (frontend, done)

- **New product:** a "This product has variations" checkbox. When ticked, the
  single price / stock / weight fields are replaced by a table of variations:
  - **Name** (shown to customers, e.g. "80ml"), **SKU**, **Price (USD)**: required
  - **Weight (kg)**: optional
  - **Initial stock**: required
  - **Low stock alert at**: optional

  The product keeps its own **SKU**, which is the code for the product as a
  whole. Variations are optional, and an unticked box creates a plain product
  exactly as today.
- **Edit product:** a "Variations" section under the edit form. Each variation
  can be edited and saved on its own, hidden or shown in the shop
  (`active`), deleted, or added. Adding the first variation to an existing
  product converts it to per-variation stock.
- **Stock button:** for a product with variations, it asks which variation
  before applying the +/- delta.
- **Products table:** shows a price range ("$6.50 – $12.00") and total stock
  ("16 on hand · 3 variations"). The row is flagged amber if any variation is
  low.
- **Low-stock banner:** names the variation, e.g. "Moisture Surge (80ml)".

### What customers now see (frontend, done)

- **Product cards:** show "From $6.50" when variation prices differ. The
  card's button says **Choose Options** and opens the product window instead
  of adding to the cart.
- **Product window:** shows option buttons. Price, stock line ("Low stock —
  only 2 left" in red) and the cart quantity limit all follow the selected
  variation. Sold-out variations are struck through.
- **Cart, checkout and order confirmation:** show the variation name. The
  cart keeps one line per product + variation.
- **Shipping weight:** comes from the variation's `weightKg`.

### Data model

```prisma
model ProductVariant {
  id         String      @id @default(uuid())
  productId  String
  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  name       String      @db.VarChar(80)
  sku        String      @unique            // see uniqueness rule below
  priceUsd   Decimal     @db.Decimal(10, 2)
  weightKg   Decimal?    @db.Decimal(8, 3)
  active     Boolean     @default(true)
  sortOrder  Int         @default(0)
  stockLevel StockLevel?
  orderItems OrderItem[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@unique([productId, name])
  @@index([productId])
}

model StockLevel {
  // existing fields…
  productId String?  @unique   // product-level stock (products without variations)
  variantId String?  @unique   // variation stock
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  // exactly one of productId / variantId is set (CHECK constraint)
}

model OrderItem {
  // existing fields…
  variantId           String?
  variant             ProductVariant? @relation(fields: [variantId], references: [id])
  variantNameSnapshot String?         // like productNameSnapshot
}
```

If you'd rather not make `StockLevel.productId` nullable, a separate
`VariantStockLevel` table with the same columns is fine. The API shape below
is what matters. **No data migration is needed.** Existing products have no
variants and keep working.

**SKU uniqueness:** a SKU must be unique across **both** products and
variants. Check both tables on create/update and return **409** with a
human-readable `message` ("SKU CREAM-80 is already used by …").

### API

**Catalog responses** (`GET /catalog/products`, `GET /catalog/products/:id`,
and the admin list): every product gets

```ts
variants: ProductVariant[]   // [] when none; ordered by sortOrder
// ProductVariant = { id, productId, name, sku, priceUsd: "6.50", weightKg: "0.120" | null,
//                    active, sortOrder, stockLevel: { id, quantityOnHand, lowStockThreshold, updatedAt } | null }
```

- **Public endpoints:** return only `active` variants.
- **Admin requests:** return all variants, including inactive ones.
- `stockLevel.lowStockThreshold` must be included publicly (as for products),
  or the red "Low stock" never shows.

**Create with variations:** `POST /catalog/products` accepts optional

```ts
variants?: { name: string; sku: string; priceUsd: number; weightKg?: number;
             initialStock: number; lowStockThreshold?: number }[]
```

When `variants` is present and non-empty:
- Create the product and its variants in **one transaction**, with each
  variant's `StockLevel`.
- Ignore the product-level `initialStock` / `lowStockThreshold` / `weightKg`.
  The frontend sends `initialStock: 0`.
- Set `product.priceUsd` to the **lowest active variant price**.
- Variant names must be unique within the product, and SKUs unique globally
  (400/409).

**Variant management (admin):** roles `super_admin`, `marketplace_manager`.

| Method & path | Body | Notes |
|---|---|---|
| `POST /api/marketplace/catalog/products/:id/variants` | `{ name, sku, priceUsd, weightKg?, initialStock, lowStockThreshold? }` | 201 + the variant. `sortOrder` = last + 1 |
| `PATCH /api/marketplace/catalog/products/:id/variants/:variantId` | any of `{ name, sku, priceUsd, weightKg, active, sortOrder, lowStockThreshold }` | `lowStockThreshold` updates the variant's StockLevel |
| `DELETE /api/marketplace/catalog/products/:id/variants/:variantId` | none | **409** if any OrderItem references it. The admin then offers "Hide from shop" (`PATCH active:false`) |
| `POST /api/marketplace/catalog/products/:id/variants/:variantId/stock-adjustment` | `{ delta: integer }` | Same rules as the product stock-adjustment, e.g. 400 if the result would go below 0 |

- Return **404** if the variant doesn't belong to `:id`.
- After any create, update or delete of variants, **recompute
  `product.priceUsd`** = min price of active variants. If none are active,
  leave it unchanged.
- `PATCH /catalog/products/:id` from the frontend **omits** `priceUsd` and
  `weightKg` for a product that has variants. Keep that semantics: absent
  means unchanged.

**Low stock:** `GET /catalog/low-stock` should include variant stock rows, with
`variant` populated:

```ts
LowStockItem = StockLevel & { product: Product; variant?: ProductVariant | null }
```

The low-stock email should name the variation the same way.

### Orders

`POST /api/marketplace/orders` items become

```ts
items: { productId: string; variantId?: string; quantity: number }[]
```

Rules, which add to the C3 validation from the security audit:
- If the product has **any active variant**, `variantId` is **required** (400
  "Please choose an option for …").
- If the product has none, `variantId` must be absent.
- `variantId` must belong to `productId` and be `active`.
- Use the **variant's** `priceUsd` for the line, its `weightKg` for shipping
  weight, and its `StockLevel` for the stock check (409 when short) and the
  decrement on confirmation. Restock the same row on cancel/return.
- Uniqueness of lines is now per `(productId, variantId)`. The same product
  in two sizes is two lines.
- Snapshot the variant: `OrderItem.variantId`, `variantNameSnapshot =
  variant.name`. Keep `productNameSnapshot` as the product name. The frontend
  renders "Product (80ml)".

Return `variantId` and `variantNameSnapshot` on order items, for both public
and admin order responses. The admin Orders page will show them once present.

### Shipping

Server-side shipping (security audit, C3 note) must use the variant's
`weightKg` for variant lines.

---

## 2. Seasonal Pricing calendar shows existing bookings (frontend only)

Villa admin → **Seasonal Pricing** now marks every booked night on both
calendars with a coloured bar:
- direct booking (green)
- Airbnb (red)
- Booking.com (blue)
- manual block (grey)
- **being booked, awaiting payment** (amber)

Hovering shows the source and, for direct bookings, the guest name. If the
selected dates include booked nights, a note explains that existing bookings
keep their price. The data refreshes every minute.

It uses two existing admin endpoints. Please just confirm these details:

1. `GET /api/availability/:propertyId?from&to` **with the admin token**
   (`optionalAuth`, from the security audit C2):
   - It returns `id, startDate, endDate, status, source, roomId, bookingId`.
   - `from` is the **1st of the current month**, so it may be a few days in
     the past. Please don't reject that for admins.
   - `to` is about 400 days ahead.
   - Blocks for **`pending_payment`** bookings (active holds) must be included
     with `status: "active"`. They are how "being booked right now" shows up.
2. `GET /api/bookings/property/:propertyId` (no status filter) must include
   `pending_payment` bookings, with `id`, `guestName` and `status`. The
   calendar matches them to blocks through `block.bookingId`.

No other backend change.

---

## 3. Payments.lk for Sri Lanka

**Scope:**
- Dona's Villa bookings (properties with `stripeAccountRef === "sri_lanka"`)
- All marketplace orders

**Italy is unchanged** and stays on Stripe.

References:
- the Payments.lk developer guide (website checkout)
- the merchant dashboard → Developers page (screenshot dated 2026-10-13)
- the merchant dashboard → AI agents page (screenshot dated 2026-10-13)

**The AI agents page is not part of this integration.** It's an optional MCP
server (`https://api.payments.lk/mcp`) that lets an assistant such as Claude
read payments, make payment links and *prepare* refunds for a person to
approve in the dashboard. Notes, in case the client turns it on later:
- It uses **agent keys** (`ak_test_…` / `ak_live_…`), which are separate
  from our secret key. An agent key is refused by the REST API, and our
  `sk_` key is refused by the MCP endpoint (403). **Never put the backend
  secret key into an agent config**, and don't add agent keys to the
  backend `.env`.
- Refunds an agent prepares only happen after someone approves them in the
  dashboard. They still reach us as `refund.succeeded`, so the webhook must
  handle refunds that our backend didn't start (see the webhook table).

### How Payments.lk works (from the guide)

- **Hosted checkout.** The server creates a checkout with
  `lk.checkouts.create(...)` (`npm install @payments-lk/node`) and sends the
  customer to `checkout.url`. The card is entered on Payments.lk's page and
  never touches our servers.
- **Webhook as the only source of truth.** Fulfil only from the signed
  webhook (`payment.succeeded`), checked with
  `lk.webhooks.constructEvent(rawBody, req.headers["payments-signature"], WEBHOOK_SECRET)`.
  The browser's return to `successUrl` proves nothing.
- **Idempotency.** Every write takes an `Idempotency-Key`. The same key and
  body within 24h returns the first answer (`Idempotent-Replayed: true`). The
  same key with a different body is refused (`idempotency_key_reused`). Keys
  are separate for test and live.
- **Amounts in cents.** `amountCents` is a whole integer of **LKR cents**
  (`Rs. 1,450.00 → 145000`, `Rs. 2,500 → 250000`). Both the developer guide
  and the AI agents guide say "money is always whole cents" of LKR. Never
  send a float.
- **Errors.** Errors are `{ code, reason, message, docUrl, traceId }`. Match
  on `code`/`reason`, never on `message`. Retry only 429, 500, 503 and
  `idempotency_key_in_progress`, with the **same** key.
- **Sandbox:**
  - Keys start `sk_test_`.
  - Sandbox *checkouts* only work once the business application is submitted.
  - Test cards: expiry **01/39 approves**, **05/39 declines**.
  - Sandbox has a monthly limit (Rs. 100,000). Past it, calls get **409
    `monthly_limit_reached`**. Usage can be reset from the Developers page.
- **Webhook events:** `payment.succeeded`, `payment.failed`,
  `checkout.expired`, `refund.succeeded`, `refund.failed`,
  `account.limit.approaching`, `account.limit.reached`,
  `account.limit.reset`, and others (card-on-file, subscriptions, invoices,
  none of which we use). Deliveries are retried for up to a day, so **every
  handler must be safe to run twice**. Signed with the `Payments-Signature`
  header.
- **Keys live in one mode.** A sandbox key only sees sandbox payments and a
  live key only sees live ones. Webhook endpoints are also per mode
  ("Sandbox events" / live), so going live needs a **second** endpoint with
  its own secret.
- **Rate limits.** The guide quotes 240 calls/minute per key for agent keys.
  We'll be nowhere near that, but treat a 429 as "retry with the same
  idempotency key after a short wait".

### Environment variables (backend)

**Don't remove anything that exists today.** Stripe keys stay, because Italy
uses them, and so does Sri Lanka until cutover.

| Variable | Status | Value / purpose |
|---|---|---|
| `PAYMENTS_LK_SANDBOX` | **already added** (same key as the frontend `.env`) | Sandbox secret key `sk_test_…` |
| `PAYMENTS_LK_SECRET_KEY` | new, **leave unset for now** | For go-live: the live `sk_live_…` key |
| `PAYMENTS_LK_WEBHOOK_SECRET` | new | Signing secret of the webhook endpoint (see "Dashboard setup") |
| `SRI_LANKA_PAYMENT_PROVIDER` | new | `stripe` (default) or `payments_lk`, the cutover switch |
| `PUBLIC_SITE_URL` | new, if not already present | `https://mansello.com`, used to build `successUrl` |
| `PUBLIC_API_URL` | new, if not already present | `https://mansello-backend-production.up.railway.app`, used to build `cancelUrl` |

Read the key as
`process.env.PAYMENTS_LK_SECRET_KEY ?? process.env.PAYMENTS_LK_SANDBOX`, so
going live is just adding the live key, with no rename. **Never log the key**,
and never return it in any response.

The frontend `.env` also contains `PAYMENTS_LK_SANDBOX`. That copy is not
used and is **never bundled**: Vite only injects the three `VITE_` values. The
frontend needs no Payments.lk key at all.

### Currency: charge in LKR, converted from USD

Sri Lanka prices are in **USD** (rooms, transport, marketplace), but
Payments.lk works in **LKR only**. Every amount in both guides is an integer
of LKR cents, the dashboard's test checkout takes "Amount (Rs.)", and the
monthly limit is in rupees. There is no currency parameter. So **convert at
the moment the checkout is created**:
  - Take a USD→LKR rate from one reliable source (e.g. the Central Bank of
    Sri Lanka daily rate, or the rate provider of your choice), cached for a
    day.
  - Compute `chargeLkr = round(totalUsd × rate, 2)`.
  - **Persist** `fxRate`, `chargeAmount` (LKR, decimal string like
    `"7254.00"`) and `chargeCurrency: "lkr"` on the booking/order.
  - **Refunds are in LKR**, as a share of `chargeAmount`, not reconverted at
    a new rate.

(If Payments.lk ever confirms USD support, the same fields still work with
`chargeCurrency: "usd"`, and nothing changes on the frontend.)

The frontend already shows the exact amount on the payment step: "You'll be
charged LKR 7,254.00 — $21.98 converted to LKR at today's rate". It reads the
two new fields, `chargeAmount` and `chargeCurrency`, on both `Booking` and
`Order`. When they're absent it shows the USD total.

### Response contract (what the frontend now handles)

`POST /api/bookings` (Sri Lanka property) and `POST /api/marketplace/orders`
keep their response shape, with the payment fields becoming either/or:

```ts
// Stripe (Italy, and Sri Lanka while SRI_LANKA_PAYMENT_PROVIDER=stripe): unchanged
{ booking | order, clientSecret: "pi_…_secret_…" }

// Payments.lk
{ booking | order,                      // incl. chargeAmount, chargeCurrency, expiresAt (bookings)
  checkoutUrl: "https://…payments.lk/…",
  clientSecret: null }
```

When `checkoutUrl` is present, the frontend shows the price breakdown, the
hold countdown (bookings) and the exact charge. It then sends the customer to
`checkoutUrl` with a "Continue to secure payment" button. It does nothing else
with Payments.lk.

### Creating the checkout

**Bookings** (`POST /api/bookings`, Sri Lanka property, provider
`payments_lk`): after the existing pending-payment booking and 15-minute hold
are created:

```ts
const checkout = await lk.checkouts.create(
  {
    amountCents: Math.round(Number(booking.chargeAmount) * 100),   // LKR cents
    description: `Dona's Villa, ${checkIn} to ${checkOut} (${nights} nights)`,
    reference: booking.id,
    successUrl: `${PUBLIC_SITE_URL}/sri-lanka/booking/confirmation?bookingId=${booking.id}`,
    cancelUrl:  `${PUBLIC_API_URL}/api/payments-lk/return/cancel?kind=booking&id=${booking.id}&sig=${hmac}`,
  },
  { idempotencyKey: `booking-${booking.id}` },
);
```

Store `checkout.id` on the booking (`paymentsLkCheckoutId`) and set
`paymentProvider = "payments_lk"`. Keep `stripePaymentIntentId` null.

**Orders** work the same way:
- `reference: order.id`
- `idempotencyKey: order-${order.id}`
- `successUrl: ${PUBLIC_SITE_URL}/sri-lanka/marketplace/order/${order.id}`
- `cancelUrl`: the cancel route with `kind=order`

**Price everything server-side.** That means the booking price, the order
lines (variant prices, §1) and shipping (security audit C3). Never use an
amount from the browser.

**Expiry and holds:**
- If `checkouts.create` accepts an expiry, set it to the booking's
  `expiresAt`, so a guest can't pay after the hold lapses.
- Either way, when the hold/order expiry job cancels a pending
  booking/order, expire its checkout if the API allows it.
- Keep the webhook backstop: a `payment.succeeded` for an already-cancelled
  booking/order is **re-confirmed if the dates/stock are still free,
  otherwise refunded automatically** and the customer emailed. This is
  security audit H2, applied to Payments.lk.

### Cancel route (new)

`GET /api/payments-lk/return/cancel?kind=booking|order&id=…&sig=…`

- `sig` = HMAC-SHA256 of `kind:id` with a server secret, so nobody can cancel
  someone else's hold by guessing ids.
- If the booking/order is still `pending_payment` / `pending`, cancel it.
  This releases the dates immediately instead of after 15 minutes, and
  restores nothing for orders, since stock was never taken.
- If it's already confirmed (the guest paid and then pressed back), do
  nothing.
- **303 redirect** to:
  - booking → `${PUBLIC_SITE_URL}/sri-lanka/airbnb?payment=cancelled`
  - order → `${PUBLIC_SITE_URL}/sri-lanka/marketplace/checkout?payment=cancelled`

The frontend shows a "Payment was cancelled, nothing was charged" notice on
both pages. The marketplace cart is still intact, because it's only cleared
after a confirmed payment.

### Webhook (new)

`POST /api/webhooks/payments-lk`. It needs a **raw body**
(`express.raw({ type: "application/json" })`), mounted **before** the JSON
body parser, exactly like the Stripe webhook.

```ts
let event;
try {
  event = lk.webhooks.constructEvent(req.body, req.headers["payments-signature"], process.env.PAYMENTS_LK_WEBHOOK_SECRET);
} catch {
  return res.sendStatus(400);              // not signed by Payments.lk
}
```

| Event | Action (idempotent) |
|---|---|
| `payment.succeeded` | Find the booking/order by `event.data.reference`. **Check `event.data.amountCents` equals the stored charge.** Confirm it, using the same code path as the Stripe confirmation: status, stock decrement, emails, iCal export. Store the Payments.lk payment id. Already confirmed → no-op. Cancelled → the H2 backstop above |
| `payment.failed` | Leave pending (the guest may retry on the same page until the hold expires). Log it |
| `checkout.expired` | Cancel the pending booking/order and release the hold |
| `refund.succeeded` / `refund.failed` | Update `refundStatus` on the booking/order. On failure, alert the admin (security audit H3: persist the refund state). **Also handle refunds we didn't start**: refunds made from the Payments.lk dashboard, or approved after an AI agent prepared them, arrive here too. Match on the payment id (`paymentsLkPaymentId`), record the amount, and flag the booking/order for the admin. Don't auto-cancel it, because a partial refund doesn't mean the stay or order is off |
| `account.limit.approaching` / `.reached` / `.reset` | Email the admin (`.reset` just clears the warning). At the limit, new checkouts fail with 409 `monthly_limit_reached`, so return a friendly 503-style message to the frontend: "Card payments are temporarily unavailable, please contact us" |

- **Always return 200 once the signature is valid**, even if a follow-up
  email fails. Catch and log email errors (security audit M3), otherwise
  Payments.lk retries for a day.
- **Never fulfil from `successUrl`.** The frontend confirmation pages poll
  `GET /api/bookings/:id` and `GET /api/marketplace/orders/:id` every 1.5 s
  for about 15 s, until the status leaves `pending_payment` / `pending`. Both
  must keep returning the pending status until the webhook lands. Orders
  showed "confirmed" immediately before, so please make sure a Payments.lk
  order really is `pending` until paid.

### Refunds

When the admin cancels a booking (`POST /api/bookings/:id/cancel`) or
cancels/returns an order whose `paymentProvider === "payments_lk"`, refund
through Payments.lk instead of Stripe:
- Partial refunds are a share of the **LKR `chargeAmount`**.
- Use `idempotencyKey: refund-${booking.id}-${n}`.
- Wait for `refund.succeeded`. Persist the refund id and status.

Stripe-paid bookings made before the cutover must still refund through
Stripe, so branch on the stored `paymentProvider`, never on the current env
switch.

### Data model additions (bookings and orders)

```prisma
paymentProvider       String   @default("stripe")   // "stripe" | "payments_lk"
paymentsLkCheckoutId  String?  @unique
paymentsLkPaymentId   String?  @unique
fxRate                Decimal? @db.Decimal(12, 6)   // USD→LKR used, when converted
chargeAmount          Decimal? @db.Decimal(12, 2)   // what the card is charged
chargeCurrency        String?                       // "lkr" (or "usd")
refundStatus          String?                       // "pending" | "succeeded" | "failed"
```

Return `chargeAmount` (as a decimal string) and `chargeCurrency` on the
booking/order objects, in public and admin responses.

### Dashboard setup (one-off)

1. Payments.lk dashboard → **Developers → Webhooks**:
   - Endpoint URL
     `https://mansello-backend-production.up.railway.app/api/webhooks/payments-lk`
   - Mode **Sandbox events**
   - **Only events from:** the sandbox secret key we use (`sk_test_obyc…`),
     not "All keys". That way, if the client later creates other keys
     (another app, the WooCommerce plugin), their payments aren't sent to us.
   - Events to tick: `payment.succeeded`, `payment.failed`,
     `checkout.expired`, `refund.succeeded`, `refund.failed`,
     `account.limit.approaching`, `account.limit.reached`,
     `account.limit.reset`. The dashboard pre-ticks only the first two, so
     tick the rest.
2. Copy the endpoint's signing secret into `PAYMENTS_LK_WEBHOOK_SECRET` on
   Railway.
3. Use **"Send a test event"** and check **Recent deliveries** shows 200.
   Before the endpoint is deployed, "Send sandbox events to the test inbox"
   on the same page shows the exact event bodies, which is useful for writing
   the handler.
4. Sandbox **keys** work straight away, but sandbox **checkouts** only work
   once the business application is submitted. If `checkouts.create` fails
   with a "not live / application" reason, that's why. Check
   Setup / Business settings in the dashboard first.
5. To test without our site, the Developers page's **"Try the checkout"**
   (amount in Rs., Sandbox) opens the same hosted page. Its
   `payment.succeeded` event goes to the endpoint, so the webhook can be
   tested on its own.

### Cutover and go-live

1. Ship everything with `SRI_LANKA_PAYMENT_PROVIDER=stripe`. Nothing changes
   for customers.
2. On a **staging/dev** backend (security audit M8: not prod), set
   `payments_lk` and run the test checklist below with test cards 01/39 and
   05/39.
3. Production on the sandbox key: flip to `payments_lk` and place one real
   test booking and one order end-to-end.
4. Once Payments.lk approves the account:
   - set the live key in `PAYMENTS_LK_SECRET_KEY`;
   - add a **live** webhook endpoint and put its secret in
     `PAYMENTS_LK_WEBHOOK_SECRET`.

   Nothing else changes.
5. After a few weeks with no Stripe payments outstanding on the Sri Lanka
   account, tell us. We'll remove `VITE_STRIPE_PK_SRILANKA` from the
   frontend. Until then it stays.

No frontend deploy is needed at any of these steps: the frontend reacts to
`checkoutUrl` being present.

---

## Test checklist

**Variations**
- [ ] Create a product with 2 variations. The response has `variants` with
      stock, and `product.priceUsd` is the lowest variant price.
- [ ] Duplicate variant SKU, or a SKU equal to another product's SKU → 409.
      Duplicate name within the product → 400/409.
- [ ] `PATCH` a variant's price → `product.priceUsd` is recomputed.
- [ ] Delete a variant with orders → 409. `PATCH active:false` hides it from
      the public catalog.
- [ ] Variant stock-adjustment ±. Going below 0 → 400.
- [ ] Order without `variantId` for a product with variants → 400. With a
      variant from another product → 400.
- [ ] Order of 80ml × 1 + 100ml × 1 → two lines at their own prices.
      Confirming decrements each variant's stock. Shipping uses the variant
      weights.
- [ ] Low-stock list/email names the variation.

**Calendar**
- [ ] The admin availability response includes `pending_payment` holds as
      active blocks, with `bookingId`, and accepts a `from` in the past.

**Payments.lk (sandbox)**
- [ ] Sri Lanka booking → response has `checkoutUrl`, `clientSecret: null`,
      `chargeAmount`, `chargeCurrency`. Italy booking still gets
      `clientSecret`.
- [ ] Pay with 01/39 → webhook confirms the booking. The confirmation page
      flips from "Confirming…" to confirmed. Emails are sent once, even if the
      event is re-sent.
- [ ] Pay with 05/39 → booking stays pending, and the guest can retry until
      the hold expires.
- [ ] Press Back/Cancel on the hosted page → redirected to
      `/sri-lanka/airbnb?payment=cancelled`, and the dates are free
      immediately.
- [ ] Tampered `sig` on the cancel route → 400, nothing cancelled.
- [ ] Marketplace order → pay → order page shows "Confirming your payment…"
      then the receipt, and the cart empties. Cancel → back at checkout with
      the cart intact.
- [ ] Webhook with a bad signature → 400. A `payment.succeeded` whose
      `amountCents` doesn't match → not confirmed, and logged.
- [ ] Payment arriving after the hold expired → re-confirmed if free,
      otherwise auto-refunded.
- [ ] Admin cancel with refund on a Payments.lk booking → refund goes
      through Payments.lk in LKR. `refund.succeeded` updates `refundStatus`.
      An older Stripe booking still refunds via Stripe.
- [ ] Sandbox limit reached (409 `monthly_limit_reached`) → the frontend gets
      a friendly message, not a 500.

---

## Frontend changes made (for reference)

| Area | Files |
|---|---|
| Variations: types, API, helpers | `src/lib/api/types.ts` (`ProductVariant`, `variants`, order `variantId`), `src/lib/api/marketplace.ts` (variant endpoints), `src/lib/variants.ts` |
| Variations: admin | `src/components/admin/product-variants.tsx`, `src/pages/admin/(protected)/marketplace/products/page.tsx` |
| Variations: shop and cart | `product-detail-dialog.tsx`, `best-products.tsx`, `deal-of-the-day.tsx`, `cart-provider.tsx` (lines keyed by product + variation), cart, checkout and order pages |
| Pricing calendar | `src/components/admin/villa/price-calendar.tsx`, `villa-rate-overrides-tab.tsx` |
| Payments.lk | `src/components/payments/hosted-checkout-panel.tsx`, `booking-provider.tsx` + `payment-step.tsx` (bookings), marketplace checkout page, order confirmation page (polls until confirmed, then clears the cart), `?payment=cancelled` notices |
| Env | `.env` annotated (no values changed or removed), `.env.example` note |
