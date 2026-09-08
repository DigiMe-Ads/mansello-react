// schema.org JSON-LD builders.
//
// These describe content that is already on the page — they add machine-readable
// markup, never new user-visible claims. Google requires that structured data
// match what a visitor actually sees, so every field here is sourced from the
// same data the components render.

import {
  SITE_URL,
  SITE_NAME,
  CONTACT_EMAIL,
  ITALY_BUSINESS,
  SRI_LANKA_BUSINESS,
  absoluteUrl,
} from "./site";

type Business = typeof ITALY_BUSINESS | typeof SRI_LANKA_BUSINESS;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    logo: absoluteUrl("/images/logo.webp"),
    sameAs: [...ITALY_BUSINESS.sameAs, ...SRI_LANKA_BUSINESS.sameAs],
  };
}

/** A rentable property (the Bologna apartment / the Sri Lanka villa). */
export function lodgingBusinessSchema(opts: {
  business: Business;
  name: string;
  description: string;
  path: string;
  image: string;
}) {
  const { business, name, description, path, image } = opts;
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    streetAddress: business.streetAddress,
    addressLocality: business.addressLocality,
    addressCountry: business.addressCountry,
  };
  if ("postalCode" in business) address.postalCode = business.postalCode;

  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}${path}#lodging`,
    name,
    description,
    url: absoluteUrl(path),
    image: absoluteUrl(image),
    email: CONTACT_EMAIL,
    telephone: business.telephone,
    address,
    sameAs: [...business.sameAs],
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingSchema(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
}) {
  const { title, description, path, image, publishedAt, updatedAt, author } = opts;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  if (image) schema.image = absoluteUrl(image);
  if (publishedAt) schema.datePublished = publishedAt;
  if (updatedAt) schema.dateModified = updatedAt;
  if (author) schema.author = { "@type": "Person", name: author };
  return schema;
}

/** A place featured on a destination page. */
export function touristDestinationSchema(opts: {
  name: string;
  description: string;
  path: string;
  image: string;
  countryCode: string;
}) {
  const { name, description, path, image, countryCode } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name,
    description,
    url: absoluteUrl(path),
    image: absoluteUrl(image),
    address: { "@type": "PostalAddress", addressCountry: countryCode },
  };
}

/** A multi-day tour package. */
export function touristTripSchema(opts: {
  name: string;
  description: string;
  path: string;
  image?: string;
}) {
  const { name, description, path, image } = opts;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": `${SITE_URL}/#organization` },
  };
  if (image) schema.image = absoluteUrl(image);
  return schema;
}
