# Mansello Frontend → Backend: editable site content ("Content" admin tab)

Lets the client edit the public site's marketing copy and imagery without a
code deploy, from a new **Content** tab in the admin panel.

The frontend is built and live behind 404-safe fallbacks: until these endpoints
exist, the admin tab is fully usable but can't save, and the public site renders
its built-in defaults — which are byte-identical to the copy that was hardcoded
before this feature existed.

---

## 1. The model: a flat key/value store

Deliberately not a schema-per-section design. The frontend owns the schema —
which fields exist, what type each is, what its default is, and which component
renders it — in `src/lib/content/schema.ts`. The backend only needs to store
strings against keys.

That means **adding a new editable field never requires a backend change.**

Keys look like `<scope>.<section>.<field>`:

```
global.brand.logo
global.contact.email
global.contact.italyPhone
global.social.sriLankaInstagram
italy.hero.title
italy.welcome.highlights
sri_lanka.hero.backgroundImage
```

36 keys exist today. Treat the key as an opaque string — don't parse it,
don't validate it against a list, and don't reject unknown keys. A frontend
deploy that adds `italy.services.title` must work against an unchanged backend.

### Values are always strings

Including images (a URL path like `/images/logo.webp`, or an uploaded URL from
`POST /api/uploads/images`) and lists. Multi-line fields — the welcome
"highlights" bullets, postal addresses — are newline-separated inside a single
string; the frontend splits them. Store text verbatim, newlines included.

### Table

```sql
create table site_content (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);
```

No `site` column: scoping already lives in the key prefix, and a flat table
keeps `GET /api/content` to one query with no joins.

---

## 2. Endpoints

### `GET /api/content` — public, unauthenticated

Called once on app load by `ContentProvider`, so it is on the critical path for
every visitor. Keep it fast and cacheable.

```json
[
  { "key": "italy.hero.title", "value": "Italy" },
  { "key": "global.contact.email", "value": "info@mansello.com" }
]
```

Return **only** rows that exist. Do not fabricate defaults — an absent key is
how the frontend knows to use its built-in value, and that distinction is what
makes "never edited" and "edited back to the default" behave identically.

An empty array is a valid, expected response (nothing edited yet).

`Cache-Control: public, max-age=60` or similar is appropriate. It is public
marketing copy, it changes rarely, and it is fetched by every visitor.

### `PUT /api/admin/content` — admin, `super_admin` only

Upserts. **Only the keys sent are touched**; every other key is left alone. The
admin UI sends just the fields that actually changed.

```json
{ "entries": [
    { "key": "italy.hero.title", "value": "Bella Italia" },
    { "key": "global.contact.email", "value": "hello@mansello.com" }
] }
```

Returns the saved entries.

### `DELETE /api/admin/content` — admin, `super_admin` only

Removes keys so the site falls back to its built-in defaults.

```json
{ "keys": ["italy.hero.title"] }
```

Not currently called by the UI — "Restore defaults" writes the default values
explicitly instead, which is more predictable for the client (the field visibly
shows what it reverted to). Worth having for cleanup.

---

## 3. Security — please read, this is a stored-content surface

The blog and testimonials were reviewed as the site's XSS surface and came back
clean, because everything is rendered as a JSX text child and React escapes it.
**Content values are rendered the same way** — as text children, never through
`dangerouslySetInnerHTML` — so stored HTML is displayed literally rather than
executed, and no sanitiser is needed on either side. **Please keep it that
way**: if a rich-text editor is ever added here, that guarantee disappears and
sanitisation becomes mandatory.

Two things the backend does need to handle:

1. **`PUT`/`DELETE` must be `super_admin` only, enforced server-side.** The
   frontend gates the tab with `RequireAdmin roles={["super_admin"]}`, but that
   check reads a role out of `localStorage` and is trivially bypassed — see
   `BACKEND_CHANGES_SEO_SECURITY_HARDENING.md` §6.1. This endpoint rewrites
   what every visitor to the site reads, so it is a defacement vector if the
   role is not verified against the JWT.
2. **URL-shaped values need validating.** `global.social.*` and the image keys
   end up in `href` and `src`. The frontend's `isRenderableImageSrc` allowlists
   `/`-prefixed and `http(s)://` values for images, and React 19 blocks
   `javascript:` URLs at the framework level — but rejecting anything that
   isn't a root-relative path or `https://` URL on write is cheaper than
   relying on both.

A size cap per value (say 16KB) is worth having. The longest real field is a
two-paragraph welcome section.

---

## 4. Seeding / defaults

**The backend does not need seed data.** The defaults live in
`src/lib/content/schema.ts` and are the exact strings and image paths that were
previously hardcoded in the components. The site renders correctly against a
completely empty `site_content` table.

The admin panel's "Restore Defaults" button is a client-side operation that
posts those defaults back through `PUT /api/admin/content` — so a fresh install
never needs a migration, and the client always has a one-click way back to the
shipped content if they edit something into a mess.

Resolution order for every field, in the frontend:

```
saved value (non-empty)  ->  built-in default  ->  ""
```

An empty saved value falls through to the default rather than rendering a blank
heading, which is a deliberate guard against the client clearing a field by
accident.

---

## 5. Failure behaviour — please preserve it

`ContentProvider` never blocks rendering and never surfaces an error. If this
endpoint 404s, times out, or returns garbage, the site renders its defaults and
the visitor sees nothing wrong.

That is a hard requirement, not a nicety: **a CMS outage must not blank the
marketing site.** Please don't introduce a code path where a content failure
can produce an empty page — for example, don't make `GET /api/content` return
5xx on a partial read when an empty array would do.

---

## 6. Fields covered today

36 keys across five sections. Every one maps to a real rendered element — the
admin UI contains no controls that do nothing.

| Scope | Section | Fields |
|---|---|---|
| Shared | Logo & Branding | logo (nav + both footers) |
| Shared | Contact Details | email, Italy phone, Sri Lanka phone, Italy address, Sri Lanka address |
| Shared | Social Media Links | Facebook + Instagram per site |
| Italy | Homepage Hero | eyebrow, headline, body, button label, background image |
| Italy | Welcome Section | heading, 2 paragraphs, highlights list, 4 photos |
| Sri Lanka | Homepage Hero | eyebrow, headline, body, button label, background image |
| Sri Lanka | Welcome Section | heading, 2 paragraphs, highlights list, 4 photos |

Extending it is a frontend-only change: add a field to `schema.ts` with its
current hardcoded value as the default, then swap that value in the component
for `c("<key>")`. No migration, no endpoint change.

---

## 7. Frontend changes already shipped

- `src/lib/content/schema.ts` — field definitions + defaults (the seed data).
- `src/lib/api/content.ts` — API module.
- `src/components/content-provider.tsx` — fetches once, exposes `c(key)` and
  `cList(key)`, falls back to defaults on any failure. Mounted in `App.tsx`
  above the router.
- `src/pages/admin/(protected)/content/page.tsx` — the Content tab, grouped
  Shared / Italy / Sri Lanka, with per-field "reset to default", a sticky save
  bar showing the unsaved-change count, and "Restore Defaults" per scope.
  Images use the existing `ImageDropzone` and `POST /api/uploads/images`.
- Wired components: both heroes, both welcome sections, both footers, both
  navbars.
