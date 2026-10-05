# Mansello Frontend → Backend: product details, reviews, subcategories, rich-text descriptions, Booking.com iCal, manual blocks

The frontend for all of this is already done and merged. Everything new is
optional on the wire: a backend that hasn't shipped these changes still works.
Reviews hide, subcategories don't appear, and descriptions render as before.
Nothing breaks while you work through the list.

| # | Area | Backend work | Priority |
|---|---|---|---|
| 1 | Booking.com iCal import | Imports work but are tagged `airbnb`; tag them `booking_com`, check the export doesn't echo | Medium |
| 2 | Manual availability blocks | Reject zero-length blocks, clean up existing ones | Medium |
| 3 | Product descriptions | Accept and sanitize a small HTML subset | Medium |
| 4 | Subcategories | `Category.parentId` plus validation | Medium |
| 5 | Product reviews | New table and 2 public endpoints, plus rating summary on products | Medium |
| 6 | Stock on public product API | Confirm `lowStockThreshold` is exposed | Check only |

---

## 1. Booking.com iCal blocks are imported but labelled "Airbnb"

### Finding (updated 2026-10-05)

**The import works.** The Booking.com feed is being fetched and its dates are
blocked. On The Nest Bologna, the Calendar & Blocks tab shows Oct 9→10,
Oct 13→14, Oct 30→31, Nov 12→13, Nov 21→22, Dec 4→6 2026, Mar 16→22 2027 and
others. Those ranges appear only in the Booking.com feed, not in Airbnb's.

The actual bug is that **every imported block is stored with
`source = 'airbnb'`, whichever feed it came from**, so the admin shows
Booking.com bookings as "Airbnb". The block's `externalUid` still carries the
origin (`…@booking.com` vs `…@airbnb.com`):

```sql
select source, split_part(external_uid, '@', 2) as uid_domain, count(*)
from availability_blocks
where external_uid is not null
group by 1, 2;
-- expect today: airbnb | booking.com | N   <- should be booking_com
```

**Frontend stopgap (done):** the admin labels a block "Booking.com" when
`source` is `airbnb` but `externalUid` ends with `@booking.com`. This
relies on the availability endpoint keeping `externalUid` in its response, so
please don't remove it.

Feed facts, for reference (fetched 2026-10-05): `HTTP 200`,
`text/calendar`, `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE` (exclusive end),
`SUMMARY:CLOSED - Not available` on every event, UIDs ending `@booking.com`,
no `STATUS` or `DESCRIPTION`. Airbnb's events use `SUMMARY:Reserved`.

### Required changes

- **Tag the source.** Add `booking_com` to the `AvailabilitySource` enum, and
  set it when the feed host is `ical.booking.com` or the UID ends in
  `@booking.com`. The admin "Calendar & Blocks" tab already has a blue
  "Booking.com" label for it. Backfill existing rows too (see Acceptance).
  Anything else
  unrecognised can stay `airbnb` or get a generic `ical`. Tell us if you add
  `ical` and we'll add a label.
- **Treat the import field as channel-agnostic.** It's still named
  `airbnbIcalImportUrls` on the wire and the frontend keeps sending that name.
  If you rename it (e.g. `icalImportUrls`), keep accepting and returning the old
  name too, or tell us and we'll switch.
- **Avoid echo loops.** Our own export feed (`/ical/{token}.ics`) is imported
  by Airbnb *and* Booking.com. If that export includes blocks we imported
  *from* those channels, each channel re-imports the other's bookings via us,
  and Booking.com's export then re-sends them as "CLOSED". **The export
  should contain only `direct` and `manual` blocks.** Please confirm it does.
- Optional but helpful: store `lastSyncedAt` / `lastSyncError` per import
  URL so the admin can see a broken feed. If you add it to the `Property`
  response, we'll show it under the textarea.

### Acceptance

After a sync (and a one-off backfill:
`update availability_blocks set source = 'booking_com' where source = 'airbnb' and external_uid ilike '%@booking.com';`),
these Booking.com dates are blocked for that
property: 9 Oct 2026, 13 Oct 2026, 30 Oct 2026, 12 Nov 2026 (one night each),
and the multi-night ranges later in the feed. They appear in Villa admin →
Calendar & Blocks with source "Booking.com", and a direct booking for any of
those nights is rejected.

---

## 2. Manual availability blocks: start 15th / end 15th blocked nothing

### What happened

Blocks are stored half-open, `[startDate, endDate)`. `endDate` is the first
free day, the same as a booking's check-out date. The client entered start
**15th**, end **15th** to block the 15th. That is a zero-length range, so it
blocked nothing. Start 15th, end 16th worked.

The storage model is correct and should **not** change. It matches bookings
and iCal. The admin form was the problem.

### Frontend change (done)

The form now asks for **"First night blocked"** and **"Last night blocked"**
(inclusive), and sends `endDate = lastNight + 1 day`. Blocking only the 15th
now sends `{ startDate: "…-15", endDate: "…-16" }`. **The API contract is
unchanged.**

The blocks list shows manual blocks as an inclusive range with a night count.
Any existing zero-length block is flagged in amber as "blocks nothing".

### Backend changes

- **Validation:** `POST /api/availability/:propertyId/blocks` should
  return **400** when `endDate <= startDate`. It currently accepts them.
- **Clean-up:** find and remove existing zero-length blocks (the client
  has at least one):

  ```sql
  select id, property_id, start_date, end_date, reason
  from availability_blocks
  where source = 'manual' and end_date <= start_date;
  -- after confirming with the client:
  -- delete from availability_blocks where source = 'manual' and end_date <= start_date;
  ```

  Alternatively the client can click "Release" on them in the admin.

---

## 3. Rich-text product descriptions

### Frontend change (done)

The product create/edit forms now use a WYSIWYG editor (bold, italic,
underline, bulleted and numbered lists). `description` is sent as an HTML
string, for example:

```html
<b>Hand-ground</b> Ceylon cinnamon.<br><ul><li>100 g jar</li><li><u>Organic</u></li></ul>
```

The storefront renders it in the new product detail dialog. Before rendering,
it runs the HTML through a whitelist sanitizer (`src/lib/rich-text.ts`).
Existing plain-text descriptions still render correctly, with newlines turned
into line breaks. **No data migration is needed.**

### Backend changes

- **Sanitize on write** (`POST /catalog/products`,
  `PATCH /catalog/products/:id`). The frontend sanitizes too, but the API is
  public-facing and must not trust it. Use the same whitelist:

  | Allowed tags | Allowed attributes |
  |---|---|
  | `b` `strong` `i` `em` `u` `br` `p` `div` `ul` `ol` `li` | **none** |

  Drop every other tag but keep its text. Remove `script`, `style`, `iframe`,
  `object` and `template` *including* their contents. Strip all attributes,
  including `style`, `class`, `href` and `on*`.

  Use a library rather than regexes: `sanitize-html` (Node), or
  `DOMPurify` + `jsdom`. Example with `sanitize-html`:

  ```ts
  import sanitizeHtml from "sanitize-html";

  export const sanitizeDescription = (html: string) =>
    sanitizeHtml(html, {
      allowedTags: ["b", "strong", "i", "em", "u", "br", "p", "div", "ul", "ol", "li"],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
      nonTextTags: ["script", "style", "iframe", "object", "template", "textarea", "noscript"],
    });
  ```

- **Length:** markup adds overhead. If `description` has a length limit
  below ~10,000 characters, raise it, and make sure the column is `text`.
- **Empty check:** "required" should mean "has visible text after stripping
  tags". `<br>` alone should fail with 400.
- **Plain-text consumers:** anything that puts a description somewhere
  other than HTML should strip tags first. That includes order emails, SEO
  meta / JSON-LD, CSV exports, and Stripe line-item descriptions.

---

## 4. Subcategories

### Frontend change (done)

- Admin → Marketplace → Products: the New/Edit Category forms have a
  **Parent category** select ("None — this is a main category" or
  "Subcategory of X"). The category list shows subcategories indented under
  their parent. The product category dropdown lists each parent followed by
  its subcategories, and a product can be filed under either.
- Storefront: the category chips show top-level categories only. Selecting
  one reveals a second row: "All Pantry", "Spices", "Tea", and so on. Selecting a
  parent shows its own products **plus** all its subcategories' products.
  The product dialog shows the path ("Pantry › Spices").

**Only one level of nesting.** A subcategory can't have subcategories.

### Data model

```prisma
model Category {
  // ...existing fields
  parentId  String?
  parent    Category?  @relation("CategoryChildren", fields: [parentId], references: [id], onDelete: Restrict)
  children  Category[] @relation("CategoryChildren")

  @@index([parentId])
}
```

Migration: nullable column, defaults to `null`. All existing categories stay
top-level, so nothing changes until the client creates a subcategory.

### API

- `GET /api/marketplace/catalog/categories`: include `parentId` (string or
  `null`) on every category. Keep returning a **flat** list, because the
  frontend builds the tree itself.
- `POST /catalog/categories`: accept optional `parentId`.
- `PATCH /catalog/categories/:id`: accept optional `parentId`. **`null`
  means "move back to top level"**, which is different from the key being
  absent (no change).
- Products' embedded `category` object should also include `parentId`.

### Validation (400 unless noted)

- `parentId` must reference an existing category.
- The parent must itself be top-level (`parent.parentId == null`).
- A category can't be its own parent.
- A category **that has children** can't be given a parent.
- `DELETE /catalog/categories/:id` on a category with children → **409**
  with a message like "Move or delete its subcategories first". This matches
  the existing 409-when-products-assigned behaviour, and the admin already
  shows the message.

### Product filtering

`GET /catalog/products?category=<slug>`: when the slug is a **top-level**
category, return products in it **and** in its subcategories. When it's a
subcategory, return only that subcategory's products. (The storefront
currently filters client-side from the full list, so this is for API
consistency and future server-side filtering.)

Slugs stay globally unique, as today.

---

## 5. Product reviews

### Frontend change (done)

Clicking a product in the marketplace opens a detail dialog. Under the
product info it shows the review list (newest first) and a "Write a review"
form: name, 1–5 stars, comment. A new review appears in the list straight
away. Product cards and the dialog show the average rating and review count
when present. **If `GET …/reviews` fails (e.g. 404 before this ships), the
whole reviews section is hidden.**

### Data model

```prisma
model ProductReview {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  authorName  String   @db.VarChar(80)
  rating      Int      // 1-5
  comment     String   @db.Text
  ipHash      String?  // for rate limiting / abuse review, never returned
  createdAt   DateTime @default(now())

  @@index([productId, createdAt])
}
```

### Endpoints (public, no auth)

**`GET /api/marketplace/catalog/products/:id/reviews`**

Returns `ProductReview[]`, newest first. Cap at the latest 100 for now.
Returns 404 if the product doesn't exist or is inactive.

```json
[
  {
    "id": "clx…",
    "productId": "clp…",
    "authorName": "Nadia",
    "rating": 5,
    "comment": "Lovely cinnamon, arrived quickly.",
    "createdAt": "2026-10-05T09:12:00.000Z"
  }
]
```

**`POST /api/marketplace/catalog/products/:id/reviews`**

Body: `{ "authorName": string, "rating": number, "comment": string }`

- `authorName`: trimmed, 1–80 chars.
- `rating`: integer 1–5.
- `comment`: trimmed, 1–2000 chars. **Plain text.** Store it as-is and don't
  accept HTML. The frontend renders it as text, not HTML.
- Returns **201** with the created review, in the same shape as an item from
  the GET.
- Error responses use the usual `{ message }` shape. The frontend shows
  `message` to the user, so make it human-readable.
- **Rate-limit** per IP. Something like 5 reviews per hour per IP, and 1 per
  product per IP per day. Reuse the limiter from the contact/leads endpoint
  if there is one. Return 429 with a friendly message.

### Product response additions

Add to every product returned by `GET /catalog/products` and
`GET /catalog/products/:id`:

```ts
averageRating: number | null; // null when there are no reviews; full precision is fine, frontend rounds
reviewCount: number;          // 0 when none
```

Compute with an aggregate (`groupBy productId`) in the list query, not per
product. Denormalised columns updated on insert/delete are also fine.

### Moderation

Reviews publish immediately for now, because there
is no admin UI for moderation yet. Please add
`DELETE /api/marketplace/catalog/reviews/:id` (roles `super_admin`,
`marketplace_manager`) so spam can be removed. If the client later wants
approve-before-publish, we'll add a `status` column and an admin queue
together.

---

## 6. Stock level on the public product API (check only)

The dialog shows **"Low stock — only N left"** in red when
`0 < stockLevel.quantityOnHand <= stockLevel.lowStockThreshold`. Product cards
show a red "Low stock" badge on the same condition. Both fields are already in
the `StockLevel` type. Please **confirm the public `GET /catalog/products`
includes `stockLevel.lowStockThreshold`** and doesn't strip it for
unauthenticated callers. Without it, low-stock never shows (it reads as 0).

---

## Test checklist

- [ ] Booking.com-imported blocks are stored with source `booking_com`
      (new syncs + backfill of existing rows).
- [ ] Our export feed contains only `direct` + `manual` blocks.
- [ ] `POST …/blocks` with `endDate == startDate` → 400.
- [ ] Product description `<b>x</b><script>alert(1)</script><a href=…>y</a>`
      → stored as `<b>x</b>y`.
- [ ] Description `<br>` only → 400.
- [ ] Create subcategory under a top-level category → ok. Under a subcategory → 400.
- [ ] Give a parent-with-children a parent → 400. Delete it → 409.
- [ ] `PATCH` category with `parentId: null` → becomes top-level.
- [ ] `?category=<parent-slug>` includes subcategory products.
- [ ] Post review → 201, appears first in GET. Product `reviewCount`
      and `averageRating` update.
- [ ] Rating 0 or 6, empty comment, or 81-char name → 400.
- [ ] 6th review within an hour from one IP → 429.
- [ ] Public product JSON contains `stockLevel.lowStockThreshold`.
