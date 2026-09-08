// Single source of truth for site-wide SEO constants.
//
// Everything that needs an absolute URL (canonical links, Open Graph tags,
// sitemap entries, JSON-LD `@id`s) derives from SITE_URL, so moving the site
// to another host is a one-line change here.

export const SITE_URL = "https://mansello.com";

export const SITE_NAME = "Mansello";

/** Fallback share image used when a page doesn't specify its own. */
export const DEFAULT_OG_IMAGE = "/images/logo.webp";

/** Resolves a root-relative path (or an already-absolute URL) to an absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

// --- Business details -------------------------------------------------------
// These mirror the contact details already published in the footers, contact
// forms, and legal pages. They exist here only to feed structured data — the
// visible copy remains the source of truth for what users read.

export const CONTACT_EMAIL = "info@mansello.com";

export const ITALY_BUSINESS = {
  name: "Mansello Italy",
  streetAddress: "Via Alfredo Calzolari 12",
  addressLocality: "Bologna",
  postalCode: "40128",
  addressCountry: "IT",
  telephone: "+39 380 348 8663",
  // Taken verbatim from the Italy footer's social links, minus their QR/share
  // tracking params. These are share-style URLs rather than vanity profile
  // URLs — swap in canonical profile URLs if the pages ever get them.
  sameAs: [
    "https://www.facebook.com/share/1BnvnhryFX/",
    "https://www.instagram.com/thenestbologna",
  ],
} as const;

export const SRI_LANKA_BUSINESS = {
  name: "Mansello Sri Lanka",
  streetAddress: "No. 187, Kepungoda",
  addressLocality: "Pamunugama",
  addressCountry: "LK",
  telephone: "+94 74 102 4320",
  sameAs: [
    "https://www.facebook.com/share/1ESsmm1RzM/",
    "https://www.instagram.com/mansellosrilanka",
  ],
} as const;

/**
 * Trims text to a search-result-friendly length without cutting mid-word.
 * Used for descriptions built from page body copy, where the source text is
 * far longer than the ~155 characters Google will render.
 */
export function truncateForMeta(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}
