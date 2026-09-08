# Mansello Frontend → Backend: marketplace switches from COD to card payment

## The problem

The marketplace has always been cash-on-delivery (COD): an order was created
directly in a `pending` state, stock wasn't reserved until the team
confirmed it by phone, and the customer paid the driver on delivery. The
client wants this replaced with the same online card payment already used
for villa bookings — same Stripe account, same "pay up front" model — so an
order requires successful payment to exist as anything more than an
abandoned cart, the same way a booking requires payment to hold real dates.

The frontend checkout flow is already rebuilt around this and is currently
non-functional against today's backend (it now expects a `clientSecret`
back from order creation that doesn't exist yet — see "Impact until this
ships" below, this is not a gracefully-degrading change like most other
docs in this repo).

## What "pay up front" needs to mean

1. `POST /api/marketplace/orders` creates the order in a **pending-payment**
   state and, in the same call, creates a Stripe PaymentIntent for
   `order.total`, returning both — mirroring `POST /api/bookings` /
   `CreateBookingResponse` exactly:

   ```json
   {
     "order": { "id": "...", "status": "pending", "total": "42.50", "...": "..." },
     "clientSecret": "pi_..._secret_..."
   }
   ```

2. Use the **same Stripe account** as Dona's Villa's bookings (the
   `sri_lanka` `StripeAccountRef` — the marketplace has no separate Stripe
   account of its own, and the frontend's `getStripePromise("sri_lanka")`
   call in `src/components/marketplace/checkout-payment-step.tsx` is
   hardcoded to that account ref, matching that the marketplace has only
   ever existed on the Sri Lanka site).

3. A webhook (or however this backend already confirms Stripe payments for
   bookings — reuse that exact mechanism) marks the order `confirmed` once
   the PaymentIntent succeeds, and sets a new `stripePaymentIntentId` field
   on the order (mirroring `Booking.stripePaymentIntentId`). This is the
   point at which stock should actually be decremented — previously that
   happened once staff manually confirmed a COD order by phone; payment
   succeeding is now the automatic equivalent of that manual confirmation,
   so inventory semantics stay the same, just automated.

4. If payment never completes (abandoned checkout, card declined and the
   customer leaves), the order stays `pending` indefinitely today — decide
   whether that needs a cleanup job (e.g. auto-cancel unpaid orders older
   than 24h) the same way a booking's hold has `expiresAt`. Not strictly
   required for a first version, but worth flagging: unlike a booking hold,
   nothing here currently expires a stale pending order.

5. Cancelling/returning a paid order should refund through Stripe to the
   original payment method, same as a booking cancellation — reuse whatever
   refund logic already exists for bookings rather than building a second
   implementation.

## Data model

### `Order` gets `stripePaymentIntentId`

```
Order.stripePaymentIntentId  string | null   -- set once payment succeeds
```

### `Order.paymentMethod`

This field already exists and is currently always `"cod"` or similar. Once
this ships it should read something like `"card"` / `"stripe"` for every
new order — check for any code (admin dashboard, reports) that branches on
its current value expecting only the old COD value.

## Endpoints

### `POST /api/marketplace/orders` (existing — change response shape)

Same request body as today (`CreateOrderInput` — customer details, delivery
address, shipping fee, items). Response changes from the bare `Order` to
`{ order, clientSecret }` as shown above. The order returned here is
`pending`, not yet reservable inventory.

### `GET /api/marketplace/orders/:id` (existing — no shape change needed)

Already returns `Order` — just make sure `status`/`stripePaymentIntentId`
reflect reality once the webhook has run. The order confirmation page
(`order-confirmation-content.tsx`) polls/loads this after the frontend's
`stripe.confirmPayment` call returns, same as the booking confirmation page
does today.

### Webhook / payment-confirmation path (existing — extend)

Whatever endpoint or job already flips a `Booking` from `pending_payment` to
`confirmed` on a successful Stripe PaymentIntent needs the equivalent
branch for `Order` — this is presumably the same Stripe webhook handler,
just needs to recognize a marketplace order's PaymentIntent (e.g. via
metadata set when the PaymentIntent was created: `{ type: "marketplace_order", orderId }`
vs. `{ type: "booking", bookingId }`) and update the right table.

## What's already done on the frontend

- `CreateOrderResponse` type (`src/lib/api/types.ts`) and `Order` gaining
  an optional `stripePaymentIntentId`.
- `src/lib/api/marketplace.ts` — `createOrder` now expects
  `CreateOrderResponse` back instead of a bare `Order`.
- `src/components/marketplace/checkout-payment-step.tsx` — new component,
  same `Elements` / `PaymentElement` / `stripe.confirmPayment` shape as the
  villa booking's `PaymentStep`, using the `sri_lanka` Stripe account.
- `src/pages/sri-lanka/marketplace/checkout/page.tsx` — the delivery-details
  form now leads into the payment step above instead of immediately
  redirecting to the confirmation page; the cart is only cleared once
  payment actually succeeds (`onPaid` callback), not when the (still-
  pending) order is first created.
- Order confirmation page and Terms/Privacy copy updated to describe card
  payment instead of cash-on-delivery.

## Impact until this ships

Unlike most docs in this repo, **this is not a graceful-degradation
change** — `createOrder`'s return type changed shape, so until the backend
returns `{ order, clientSecret }`, the checkout page will either error out
or (if the bare `Order` object happens to get destructured as
`{ order: undefined, clientSecret: undefined }`) fail confusingly when it
tries to mount the Stripe Elements payment step with no `clientSecret`.
**The Sri Lanka marketplace checkout is effectively broken until this
ships** — prioritize accordingly, or coordinate a simultaneous frontend/
backend deploy.
