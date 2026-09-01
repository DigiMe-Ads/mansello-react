# Mansello Frontend → Backend: click heatmaps ("Heatmap" admin tab)

## The problem

We want a Plerdy/Hotjar-style click heatmap: pick a page, see the whole page
rendered with a red/orange/yellow/green/blue overlay showing where visitors
actually click, hottest spots in red. This needs somewhere to record every
click a real visitor makes on the public site, and an aggregation endpoint
the admin dashboard can query to render the overlay.

The frontend is fully built and live already — a click collector runs on
every public page (never `/admin/*`) and is already sending data, and a new
"Heatmap" tab exists in the admin dashboard (super-admin only) that renders
the target page in an iframe with a canvas heat overlay on top. Both sides
are 404-safe: until the endpoints below exist, the click collector just
drops its beacons on the floor (no error, no retry, no local buffering —
today's clicks before this ships are not retroactively recoverable once it
does), and the admin tab shows "Not available yet" instead of a blank
screen.

Recommended storage: **Supabase** (hosted Postgres), since that's what was
asked for and this schema is a good fit for it — no realtime/vector features
needed, just tables, an index, and ordinary aggregate queries. Everything
below is written against plain Postgres/SQL so it maps directly whether it's
implemented via Supabase's client library, its REST/PostgREST layer, or a
raw connection from the existing backend — whichever this codebase already
prefers for talking to its database.

## Data model

### New `click_events` table (raw, high-volume)

```sql
create table click_events (
  id             bigint generated always as identity primary key,
  site           text,               -- 'italy' | 'sri_lanka' | null (homepage etc.)
  path           text not null,      -- e.g. '/sri-lanka/airbnb'
  x_pct          real not null,      -- 0–1, fraction of page width at click time
  y_pct          real not null,      -- 0–1, fraction of page height at click time
  viewport_width int not null,
  device         text not null,      -- 'desktop' | 'tablet' | 'mobile'
  session_id     text not null,      -- random per-browser-tab id, not tied to any account
  target_selector text,              -- best-effort "tag#id.class", optional, informational only
  occurred_at    timestamptz not null, -- client-reported click time
  created_at     timestamptz not null default now() -- server receive time
);

create index click_events_page_lookup
  on click_events (path, device, occurred_at);
```

Notes:
- `x_pct`/`y_pct` are already resolution-independent fractions computed on
  the client (`e.pageX / document.documentElement.scrollWidth`, same for Y
  against `scrollHeight`) — never raw pixels. This is what makes a click
  recorded on one visitor's 1920px screen line up correctly when replayed
  over the admin's preview iframe at a completely different width.
- `device` is a coarse bucket the client already computes from
  `window.innerWidth` (`<768` mobile, `768–1279` tablet, `>=1280` desktop) —
  matches the three virtual widths (390 / 834 / 1440) the admin preview
  iframe renders at, so a "mobile" filter actually corresponds to what the
  overlay is drawn on top of.
- `session_id` is a random UUID stored in the visitor's `sessionStorage` —
  not a user account, not a fingerprint, resets every new tab/session. It
  exists only so "page views" (distinct sessions per page) can be counted
  separately from raw click volume; no other use.
- No IP address, user agent, or any other visitor-identifying data is sent
  by the client today. If you add any (e.g. for bot filtering — see
  "Abuse/bot traffic" below), keep it out of any response the admin
  dashboard reads, and check it against this project's privacy policy pages
  (`/italy/privacy`, `/sri-lanka/privacy`) first.
- Retention: raw rows here are only ever consumed in aggregate (see the read
  endpoint below) and can grow fast on a busy site. Recommend a scheduled
  job (Supabase cron / pg_cron, or whatever this backend already uses for
  scheduled work) that deletes rows older than **180 days**. Nothing on the
  frontend assumes rows live longer than the date ranges it offers (max 90
  days), so 180 gives headroom without keeping data indefinitely.

### Aggregation approach — compute at read time, not a second table

Given the traffic volumes here (a small marketing/booking site, not a
high-scale consumer app), a materialized aggregate table is very likely
premature. The read endpoint below can aggregate straight off
`click_events` with a single grouped query:

```sql
select
  round(x_pct::numeric, 2) as gx,
  round(y_pct::numeric, 2) as gy,
  count(*) as weight
from click_events
where path = $1
  and occurred_at >= $2 and occurred_at < $3
  and ($4::text is null or device = $4)   -- $4 = null when the "All Devices" filter is selected
group by gx, gy;
```

Rounding to 2 decimal places buckets clicks into a 100×100 grid across the
page, which is exactly the resolution the frontend's canvas renderer expects
(see `HeatPoint` in `src/components/admin/heatmap/heat-canvas.ts` — it draws
one soft radial blob per point, radius scaled to the render size, so a
100×100 grid already looks like a smooth continuous heatmap, not a grid of
dots). If this table ever grows large enough that this query gets slow,
revisit with a proper pre-aggregated rollup table refreshed periodically —
not needed for a first version.

## Endpoints

### `POST /api/analytics/click-events` — public, unauthenticated

This is a high-volume, fire-and-forget ingest endpoint hit directly from
every visitor's browser (`navigator.sendBeacon`, falling back to `fetch`) —
**not** from `authedFetch`, no admin/session context, no CORS-with-
credentials needed.

Body:

```json
{
  "events": [
    {
      "site": "sri_lanka",
      "path": "/sri-lanka/airbnb",
      "xPct": 0.4231,
      "yPct": 0.1187,
      "viewportWidth": 390,
      "device": "mobile",
      "sessionId": "b7e2b6b0-...",
      "targetSelector": "button.rounded-full",
      "occurredAt": "2026-08-31T09:12:04.331Z"
    }
  ]
}
```

- Up to 50 events per request (the client batches and flushes every 5s or on
  page hide/unload, whichever comes first — see
  `src/lib/analytics/click-tracker.ts`). Reject/truncate anything wildly
  larger defensively, but don't bother validating much beyond types/ranges —
  this must stay fast, and a malformed event is just a dropped data point,
  never something worth failing loudly over to a real visitor's browser.
- Clamp `xPct`/`yPct` server-side to `[0, 1]` before inserting (the client
  already clamps, but never trust that alone).
- Respond `202 Accepted` (or `204`) immediately — don't make the visitor's
  browser wait on anything beyond the insert itself, and don't ever return a
  4xx/5xx in a way that could surface to the visitor (there's nothing they
  could do about it anyway; the client already swallows every failure
  silently).
- **No auth, no CSRF token** — same trust level as any other public
  form-adjacent endpoint on this site (e.g. the newsletter signup or contact
  form), not a booking/payment endpoint.

#### Abuse / bot traffic

Because this is unauthenticated and public, it's a target for junk data
(scrapers, bots, or someone just hammering it). Recommended, roughly in
order of effort:
1. **Rate-limit per IP** — this backend likely already has a rate-limiter
   for other public endpoints (contact form, newsletter); reuse it. A
   generous limit (this fires often for real visitors scrolling/clicking
   normally) like 300 events/minute/IP is plenty of headroom while still
   capping runaway abuse.
2. **Origin/Referer check** — reject requests whose `Origin`/`Referer`
   header isn't one of this site's own domains, the same way you'd guard any
   endpoint that's only ever meant to be called from your own frontend.
3. (Optional, later) basic bot user-agent filtering if junk data becomes a
   visible problem in the heatmaps — not needed to ship a first version.

### `GET /api/analytics/heatmap` — admin only (`super_admin`)

Query params: `path` (required, e.g. `/sri-lanka/airbnb`), `device`
(`all` | `desktop` | `tablet` | `mobile`, default `all`), `from`, `to`
(`YYYY-MM-DD`, inclusive/exclusive however this backend's other date-range
endpoints already do it — match that convention, don't invent a new one).

```json
{
  "site": "sri_lanka",
  "path": "/sri-lanka/airbnb",
  "device": "all",
  "from": "2026-08-01",
  "to": "2026-08-31",
  "totalClicks": 4213,
  "totalPageViews": 1876,
  "maxWeight": 96,
  "points": [
    { "xPct": 0.42, "yPct": 0.12, "weight": 96 },
    { "xPct": 0.5, "yPct": 0.35, "weight": 41 }
  ]
}
```

- `totalClicks` = `count(*)` matching the filters.
- `totalPageViews` = `count(distinct session_id)` matching the same filters
  — this is what the frontend labels "Page Views"; it's really "distinct
  visiting sessions in this range", not a separate pageview-tracking system.
- `maxWeight` = the highest `weight` among the returned `points` — the
  frontend normalizes every point's color/opacity against this (a page with
  one runaway-popular button still renders every other point on a sensible
  relative scale, rather than everything but the hottest spot reading as
  stone cold).
- `points` = the grouped-and-rounded rows from the aggregation query above.
  Omit any point with `weight` below some small floor (e.g. 2) if the volume
  ever gets noisy — not necessary at current traffic levels.

### `GET /api/analytics/heatmap/pages` — admin only (`super_admin`)

Query param: `site` (optional, `italy` | `sri_lanka`).

```json
[
  { "site": "sri_lanka", "path": "/sri-lanka/airbnb", "label": "/sri-lanka/airbnb", "clicks": 4213 },
  { "site": "sri_lanka", "path": "/sri-lanka", "label": "/sri-lanka", "clicks": 1102 }
]
```

Purely cosmetic on the frontend today — it annotates the page dropdown with
click counts (e.g. "Villa / Booking (4,213 clicks)") so an admin can see at
a glance which pages have meaningful data before picking one. `label` can
just echo `path`; the frontend already has its own human-readable labels for
the pages it lists and only uses this response's `clicks` numbers, keyed by
`path`. Group by `path` (all devices, all time, or whatever window is
cheapest to compute — this is a hint, not the primary data view) and return
every path seen so far, not just the seven or so "known" ones the frontend's
dropdown currently hardcodes.

## What's already done on the frontend

- `src/lib/analytics/click-tracker.ts` — mounted once near the root of the
  app (`App.tsx`), listens for every click outside `/admin/*`, computes the
  normalized `xPct`/`yPct`/`device` fields described above, batches in
  memory, and flushes via `sendBeacon`/`fetch` to `POST
  /api/analytics/click-events`. Respects `navigator.doNotTrack`. Every
  failure path (network error, endpoint 404, storage disabled) is swallowed
  silently — this can never surface an error to a real visitor.
- `HeatmapPoint`, `HeatmapData`, `HeatmapPageInfo`, `HeatmapDevice`,
  `ClickEventInput` types (`src/lib/api/types.ts`).
- `src/lib/api/heatmap.ts` — `getHeatmapData` and `listHeatmapPages`, the two
  admin-side read calls (currently 404 until the endpoints above exist).
- `src/components/admin/heatmap/heat-canvas.ts` — the pure-canvas renderer:
  draws each aggregated point as a soft radial blob, colorizes by a shared
  blue→cyan→green→yellow→orange→red lookup table (also used for the on-
  screen legend, so they can't drift apart), matching the Plerdy/Hotjar
  look.
- `src/components/admin/heatmap/heatmap-viewer.tsx` — the admin tab's UI:
  site/page/device/date-range filters, an iframe of the real page (loaded
  same-origin from this app's own public routes, forced to a virtual
  device-width of 390/834/1440px to match how `device` buckets were
  captured) with the canvas overlay positioned on top, a legend bar, and
  summary stats (total clicks, page views, range, device). Handles the
  404-not-shipped-yet state the same way every other tab in this dashboard
  does.
- `src/pages/admin/(protected)/heatmap/page.tsx` and the `/admin/heatmap`
  route (`App.tsx`) — restricted to `super_admin`, matching the other
  site-wide (non-per-property) admin tools like Blog and Admin Users.
- New "Heatmap" item in the admin sidebar (`admin-shell.tsx`).

## Impact until this ships

- The click collector on the public site is already live in production
  terms — it fires on every click, tries to send it, and gets nothing but a
  404 back today. No visible effect on visitors (every failure is silent),
  but **no click data is being retained** until the ingest endpoint exists —
  there's no client-side buffering/retry across page loads, so clicks from
  before this ships are gone, not backfillable.
- The admin Heatmap tab shows "Not available yet — the backend doesn't have
  this endpoint until BACKEND_CHANGES_HEATMAP_ANALYTICS.md is implemented."
  instead of a heatmap.
- Once `POST /api/analytics/click-events` ships but before the two `GET`
  endpoints do: data starts accumulating in `click_events`, but the admin
  tab still shows "Not available yet" until it can actually read it back.
  Worth shipping the ingest endpoint first regardless, purely so data starts
  backfilling for whenever the read side follows — no reason to make guests'
  clicks over that window unrecoverable a second time.
