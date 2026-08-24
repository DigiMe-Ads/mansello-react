# Mansello Frontend → Backend: admin needs to see inactive marketplace products

## The problem

The new category/product delete UI (per `FRONTEND_CHANGES_CATALOG_DELETE.md`)
is blocked for any category that has a **deactivated** product in it.

Repro:
1. A product gets deactivated (`PATCH /api/marketplace/catalog/products/:id`,
   `{ "active": false }`) — the documented way to retire a product that has
   order history and therefore can't be deleted.
2. Someone tries to delete that product's category.
3. `DELETE /api/marketplace/catalog/categories/:id` correctly returns `409`
   ("this category still has N product(s)") — the deactivated product still
   references it.
4. But the admin product list only shows **active** products, so there's no
   way to find that product to move it to another category (`PATCH
   { categoryId }`) or delete it outright. The category is now permanently
   stuck — no path in the UI gets it to zero products.

## Root cause

`GET /api/marketplace/catalog/products` (and its `?category=` filter) is
public and unconditionally filters to `active: true`, with no authenticated
variant that includes inactive ones.

This is the same shape of problem `GET /api/blog/posts` already solves
(API_DOCUMENTATION.md §10): that endpoint is public-by-default
(published-only) but branches to include drafts too when the request carries
a valid `super_admin` token — same path, same handler, no separate admin
route.

## Requested change

Mirror that exact pattern on `GET /api/marketplace/catalog/products`:

- **No token, or a non-admin token**: unchanged — `active: true` only, same
  as today. The public storefront (marketplace homepage, Deal of the Day,
  Best Products) is unaffected either way.
- **Valid `super_admin` or `marketplace_manager` token**: include inactive
  products in the result too (still respecting `?category=` if passed).

Also worth a quick check while in there: does `GET
/api/marketplace/catalog/products/:id` (single product) currently return a
deactivated product regardless of auth, or does it 404 for inactive ones
too? If the latter, applying the same admin-token branch there would keep
things consistent — right now it's moot since there's no way to discover an
inactive product's id in the first place, but it'll matter once the list
endpoint is fixed.

## What's already done on the frontend

- Added `getProductsAdmin()` (`src/lib/api/marketplace.ts`), which calls this
  same endpoint but through the authenticated fetcher (sends the admin's
  bearer token).
- Switched the admin Products page (`src/pages/admin/(protected)/marketplace/products/page.tsx`)
  to use it instead of the public `getProducts()`.

Nothing further is needed on the frontend once this ships — the admin table
will start showing inactive products (and their existing "Inactive" badge,
"Deactivate instead" flow, etc. already handle that state) as soon as the
backend starts returning them for an admin-authenticated request. Until
then, this call just returns the same active-only list it does today, so
nothing regresses in the meantime — it's just still missing the fix.

## Impact until this ships

Any category with at least one deactivated product in it **cannot be
deleted** through the admin panel — the `409` will keep firing and the
product causing it is invisible to the UI, with no workaround short of
direct database access.
