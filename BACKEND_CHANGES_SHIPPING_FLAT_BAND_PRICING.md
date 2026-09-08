# Mansello Frontend → Backend: shipping is a flat band price, not a per-kg rate

**Breaking field rename on `ShippingRate`. Read section 1 before touching anything else.**

Supersedes the shipping-fee parts of `BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md`
§300–318. Everything else in that file (discounts, city tax, rate overrides)
still stands.

---

## 1. The bug this fixes

The admin panel presents a 1–15kg grid and the client filled it in like parcel
pricing:

| Band | Value entered |
|---|---|
| 1kg | 4.99 |
| 2kg | 7.99 |
| 3kg | 9.99 |

They meant *"a 3kg order ships for $9.99."* The field was named `pricePerKg` and
the frontend multiplied it by the cart weight, so a real order came out as:

```
3 pastries x 1kg = 3kg  ->  matches the "3kg" band  ->  3 x 9.99 = $29.97
```

**$29.97 delivery on a $15.00 order.** Effective charges were 1kg → $4.99,
2kg → $15.98, 3kg → $29.97.

The multiplication was always wrong, independently of intent: **the bands are
one kilogram wide** (`fromKg: n, toKg: n`), so the band already encodes the
weight. Multiplying by weight again double-counts it. And read as genuine
per-kg rates the client's numbers are nonsense — 4.99, 3.995, 3.33 descending
is not something anyone types on purpose.

Confirmed with the client: **the value is the total delivery charge for an
order of that weight.**

---

## 2. Field rename: `pricePerKg` → `price`

The name was the root cause, so it changes with the behaviour.

### `ShippingRate` (response)

```diff
 {
   id: string
   fromKg: number
   toKg: number
-  pricePerKg: string
+  price: string        // FLAT delivery charge for an order in this band
   createdAt: string
   updatedAt: string
 }
```

### `PUT /api/marketplace/shipping-rates` (request)

```diff
 { "rates": [
-    { "fromKg": 1, "toKg": 1, "pricePerKg": 4.99 }
+    { "fromKg": 1, "toKg": 1, "price": 4.99 }
   ] }
```

### Migration

Rename the column. **Do not transform the stored values** — the client entered
them as flat band prices all along, so the existing numbers become correct the
moment the multiplication is removed.

```sql
alter table shipping_rates rename column price_per_kg to price;
```

### Compatibility during rollout

The frontend already reads `price ?? pricePerKg`, so a backend still serving
the old name keeps working and the fee is correct either way. It only ever
**writes** `price`. Accepting both names on `PUT` for one release removes any
ordering constraint between the two deploys; after that, drop `pricePerKg`.

---

## 3. The algorithm (`POST /api/marketplace/orders` must implement this)

`BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md` already requires the server to
compute `shippingFee` itself and never trust the client's value — still
outstanding, and still the single highest-value security item in the codebase
(a tampered request can currently send a negative fee). This is the algorithm
it must use. It must match the frontend exactly, or the total shown in the
Order Summary will differ from the amount charged.

```
roundedKg = max(1, ceil(sum(product.weightKg * quantity)))
if no rates configured, or total weight <= 0   -> 0

1. band where roundedKg is between fromKg and toKg (inclusive)
                                               -> band.price
2. top = band with the highest toKg
   if roundedKg > top.toKg                     -> top.price
3. gap between bands: nearest band with toKg < roundedKg,
   choosing the highest such toKg              -> nearest.price
4. below the lowest band                       -> lowest band's price
```

**No multiplication anywhere.** The band price is the fee.

Notes on the non-obvious steps:

- **Rounding is up, always.** A 2.4kg cart is charged the 3kg band.
- **Step 2 picks the top band by `max(toKg)`, not by position.** Bands sorted
  by `fromKg` put the band that *starts* highest last, which is not
  necessarily the one that *ends* highest. With overlapping bands the old code
  compared against the wrong ceiling.
- **Step 3 is the gap case.** With bands of 1–3kg and 6–10kg, a 4kg order
  matches nothing and is not above the top ceiling. It previously fell through
  to the *lowest* configured price, systematically undercharging heavier
  orders. It now charges the nearest band at or below the weight.
- **All-zero rows mean "not configured".** The admin grid ships with every band
  at 0. The frontend treats an all-zero table as unconfigured and falls back to
  a flat $5 (`FLAT_SHIPPING_FEE`) rather than shipping everything free; the
  server should do the same so the two agree.

### Test vectors

Bands 1kg → 4.99, 2kg → 7.99, 3kg → 9.99 (bands 4–15 left at 0):

| Cart weight | Expected fee | Why |
|---|---|---|
| 0.5 kg | 4.99 | rounds up to 1kg |
| 1 kg | 4.99 | exact band |
| 2 kg | 7.99 | exact band |
| 2.4 kg | 9.99 | rounds up to 3kg |
| 3 kg | **9.99** | exact band — this is the client's screenshot, previously $29.97 |
| 5 kg | 9.99 | above the highest priced band |

---

## 4. Frontend changes already shipped

- `src/lib/shipping.ts` — multiplication removed; gap and top-band rules fixed;
  reads `price ?? pricePerKg`. Also exports `hasConfiguredRates()`.
- `src/lib/hooks/use-shipping-fee.ts` — **new.** One hook shared by the cart
  and the checkout.
- `src/pages/sri-lanka/marketplace/cart/page.tsx` — **second bug fixed.** The
  cart never fetched the rate table at all; it hardcoded `FLAT_SHIPPING_FEE`,
  so it always showed $5 and the number jumped when the customer moved to
  checkout. It now uses the same hook, and shows `—` rather than a placeholder
  number while the rates are still loading.
- `src/pages/sri-lanka/marketplace/checkout/page.tsx` — the fee is now frozen
  into state at submit, so a late-arriving rate change can't leave the summary
  disagreeing with the order the server holds.
- Admin UI — the section is now "Delivery Charges by Order Weight", each input
  is labelled "Delivery charge (USD)" under an "Order weight Nkg" heading, and
  the help text states explicitly that the value is not multiplied by weight,
  with a worked example.

**No frontend change is needed when this ships.** It already sends and reads
the right shape.
