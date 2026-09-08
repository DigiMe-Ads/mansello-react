# Mansello Frontend → Backend: admin-manageable testimonials

## Status: shipped and live — this doc is now a reference, not a request

`GET /api/testimonials?site=<italy|sri_lanka>` is confirmed live in
production (verified directly against the deployed backend). The frontend
has since been updated to match reality and **no longer has a hardcoded
fallback** — both public carousels read exclusively from this endpoint now.
The one correction below (`site` is required, not optional) reflects what
the shipped backend actually does, not what was originally asked for — kept
here so the two don't drift back out of sync.

## The problem (original ask)

The "Our Client Says!" review carousel on both sites
(`src/components/italy/testimonials.tsx`,
`src/components/sri-lanka/testimonials.tsx`) used to be a hardcoded array in
each component — changing a review, adding a new one, or taking one down
meant editing code and redeploying. The client wanted to manage these
themselves from the admin dashboard, same as Blog posts, and independently
per site (Italy's carousel must never show a Sri Lanka review or vice versa).

## Data model (as shipped)

```
Testimonial
  id          string (pk)
  site        enum("italy", "sri_lanka")
  name        string        -- "Anuke"
  role        string        -- "Airbnb Guest · 1 night" — freeform, matches today's copy exactly
  quote       string (text) -- the review itself
  rating      int           -- 1–5
  sortOrder   int  default 0
  active      boolean default true
  createdAt   timestamptz
  updatedAt   timestamptz
```

## Endpoints (as shipped)

### `GET /api/testimonials?site=<italy|sri_lanka>`

**`site` is required on every call, including admin-authed ones** — this is
the one correction to the original spec. An admin request with no `site` at
all returns `400 {"error":"site is required"}` rather than "every
testimonial across both sites," which is what was originally asked for.
The frontend's admin Testimonials page (which has an "All Sites" filter)
was written expecting the optional-`site` behavior and has been corrected
to call this endpoint once per site and merge the results client-side when
"All Sites" is selected, rather than relying on the backend to do that in
one call.

Otherwise as expected: public calls return that site's **active**
testimonials sorted by `sortOrder`; a `super_admin`-authed call to the same
URL+site additionally includes inactive ones.

### `POST /api/testimonials`, `PATCH /api/testimonials/:id`, `DELETE /api/testimonials/:id`

Working as originally spec'd — `super_admin` only, same shapes as below.
Nothing to correct here as far as the frontend can tell from normal usage.

```json
[
  {
    "id": "...", "site": "sri_lanka", "name": "Anuke",
    "role": "Airbnb Guest · 1 night",
    "quote": "This was a serene stay in a beautiful villa all to ourselves...",
    "rating": 5, "sortOrder": 0, "active": true,
    "createdAt": "...", "updatedAt": "..."
  }
]
```

## What's on the frontend now

- `src/lib/api/testimonials.ts` — `listTestimonialsAdmin(fetcher, site)` now
  takes `site` as a required argument (was optional), matching the above.
- The admin Testimonials page's "All Sites" filter fetches Italy and Sri
  Lanka in two parallel calls and merges them, instead of one call with no
  `site`.
- `components/italy/testimonials.tsx` and
  `components/sri-lanka/testimonials.tsx` no longer carry a hardcoded
  fallback array — each renders nothing (not an error, not placeholder
  content) until its site's `GET /api/testimonials` call resolves, and
  keeps rendering nothing if the result is genuinely empty.
- `src/lib/testimonials-seed-data.ts` — the original hardcoded reviews from
  both sites, now living here purely as seed data for one thing: the admin
  Testimonials page's **"Seed Existing Reviews"** button. That button
  creates whichever of these aren't already in the database (matched by
  `site` + `name`, so it's safe to click more than once) — this is how an
  admin backfills the real launch reviews into the now-empty table, rather
  than the frontend silently falling back to them.

## Nothing left to ship

This doc originally tracked a not-yet-built backend feature; the backend
half is done. Kept in the repo as a record of the one behavioral difference
(`site` required) between what was asked for and what was actually built,
in case anything else on the frontend still assumes the old optional-`site`
contract.
