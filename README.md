# Mansello (React + Vite build)

This is the **Next.js → plain React** rebuild of the Mansello frontend, created so
the site can be hosted as a static bundle on **Hostinger shared hosting** (no
Node/Business plan required). The backend API is unchanged — this app talks to
it the same way the Next version did, entirely from the browser.

Stack: **Vite + React 19 + React Router v6 + Tailwind CSS v4**.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

## Production build

```bash
npm run build    # outputs static files to ./dist
npm run preview  # serve ./dist locally to sanity-check
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values (they are baked into the
build at compile time, so rebuild after changing them):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API (no trailing slash) |
| `VITE_STRIPE_PK_ITALY` | Stripe publishable key — Italy account |
| `VITE_STRIPE_PK_SRILANKA` | Stripe publishable key — Sri Lanka account |

> The original `NEXT_PUBLIC_*` names are also accepted, so an existing
> `.env.local` keeps working.

## Deploying to Hostinger

1. Run `npm run build`.
2. Upload the **contents of `dist/`** (not the folder itself) into your
   domain's `public_html`.
3. `dist/.htaccess` is included in the build — it makes Apache serve
   `index.html` for deep links (e.g. `/sri-lanka/blog/some-post`) so React
   Router can handle them. Make sure hidden files are uploaded too.

That's it — it's a static site, so any Hostinger plan works.

## How the Next.js migration was done

The app was already very portable: all data fetching happened client-side via
`fetch`, and the "server" pages were thin wrappers. The Next-specific pieces
were mapped onto plain React with small shims (see `src/shims/`), wired up via
aliases in `vite.config.ts`, so the ~90 component files needed **zero edits**:

| Next.js | Replacement |
| --- | --- |
| App Router (`app/**/page.tsx`) | React Router routes in `src/App.tsx` (pages live in `src/pages`) |
| `next/link` | `src/shims/next-link.tsx` (wraps React Router `Link`) |
| `next/image` | `src/shims/next-image.tsx` (plain `<img>`, supports `fill`) |
| `next/navigation` | `src/shims/next-navigation.ts` (`useRouter`, `usePathname`, `useSearchParams`, `useParams`) |
| `next/dynamic` | `src/shims/next-dynamic.tsx` (`React.lazy` + `Suspense`) |
| `next/font/google` | Google Fonts `<link>` in `index.html` + CSS vars in `index.css` |
| Root `layout.tsx` | `CartProvider` + fonts in `src/App.tsx` / `index.html` |
| `admin/(protected)/layout.tsx` | Layout route (`src/pages/admin/protected-layout.tsx`) with `<Outlet />` |
| `process.env.NEXT_PUBLIC_*` | Injected at build via `define` in `vite.config.ts` |
| `redirect()` / dynamic `params` | `<Navigate>` / `useParams()` |

Directory layout inside `src/pages` mirrors the old `app/` routes (dynamic
segments still use `[slug]` folder names for easy diffing against the original).
