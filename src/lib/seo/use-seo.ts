import { useEffect } from "react";
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from "./site";

// Per-route document metadata for a client-rendered SPA.
//
// The app ships a single index.html, so without this every route reports the
// same title and description. `useSeo` gives each page its own title,
// description, canonical URL, Open Graph/Twitter tags, and optional JSON-LD.
//
// Caveat worth knowing: these tags are written by JavaScript after load.
// Googlebot renders JS and will see them, but social scrapers (Facebook,
// WhatsApp, LinkedIn, Slack) read the raw HTML response and will not. Making
// link previews work per-route requires prerendering routes to static HTML at
// build time — a separate change.

export type SeoConfig = {
  /** Page title, without the site-name suffix. */
  title: string;
  description: string;
  /** Canonical path for this route, e.g. "/italy/airbnb". Query/hash omitted. */
  path: string;
  /** Share image; root-relative or absolute. */
  image?: string;
  type?: "website" | "article" | "product";
  /** BCP-47 locale for og:locale. */
  locale?: string;
  /** Keep this page out of search results (admin, checkout, confirmations). */
  noindex?: boolean;
  /** schema.org JSON-LD object(s) to embed. */
  jsonLd?: object | object[];
};

/** Marks every element this hook owns, so a route change can clear the last one's. */
const OWNED = "data-seo-managed";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(OWNED, "");
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute(OWNED, "");
  el.setAttribute("href", href);
}

function clearOwned() {
  document.head.querySelectorAll(`[${OWNED}]`).forEach((el) => el.remove());
}

export function useSeo(config: SeoConfig) {
  const {
    title,
    description,
    path,
    image = DEFAULT_OG_IMAGE,
    type = "website",
    locale = "en_US",
    noindex = false,
    jsonLd,
  } = config;

  // Serialise the JSON-LD so a fresh object literal on each render doesn't
  // retrigger the effect every time the page re-renders.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    // Titles read "<page> | Mansello", except the home page which is already
    // branded and would otherwise say "Mansello | Mansello".
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const canonical = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);

    // Start from a clean slate so tags from the previously-viewed route can't
    // linger on a page that doesn't set the same ones.
    clearOwned();

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertCanonical(canonical);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:locale", locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    if (jsonLdKey) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(OWNED, "");
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
    }

    return clearOwned;
  }, [title, description, path, image, type, locale, noindex, jsonLdKey]);
}
