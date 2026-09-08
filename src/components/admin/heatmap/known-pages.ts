import type { Site } from "@/lib/api/types";

export interface KnownPage {
  site: Site;
  path: string;
  label: string;
}

// Mirrors the public routes registered in src/App.tsx. Kept as a plain,
// hand-maintained list rather than derived from the router — a couple of
// dynamic routes (blog posts, tour packages) intentionally aren't listed
// here since a per-slug heatmap isn't useful; add a page here whenever a new
// static public route is added to App.tsx.
export const KNOWN_PAGES: KnownPage[] = [
  { site: "italy", path: "/italy", label: "Home" },
  { site: "italy", path: "/italy/about", label: "About" },
  { site: "italy", path: "/italy/airbnb", label: "Apartment / Booking" },
  { site: "italy", path: "/italy/blog", label: "Blog" },
  { site: "italy", path: "/italy/contact", label: "Contact" },
  { site: "italy", path: "/italy/terms", label: "Terms" },
  { site: "italy", path: "/italy/privacy", label: "Privacy" },

  { site: "sri_lanka", path: "/sri-lanka", label: "Home" },
  { site: "sri_lanka", path: "/sri-lanka/about", label: "About" },
  { site: "sri_lanka", path: "/sri-lanka/airbnb", label: "Villa / Booking" },
  { site: "sri_lanka", path: "/sri-lanka/transport", label: "Transport" },
  { site: "sri_lanka", path: "/sri-lanka/blog", label: "Blog" },
  { site: "sri_lanka", path: "/sri-lanka/contact", label: "Contact" },
  { site: "sri_lanka", path: "/sri-lanka/marketplace", label: "Marketplace" },
  { site: "sri_lanka", path: "/sri-lanka/terms", label: "Terms" },
  { site: "sri_lanka", path: "/sri-lanka/privacy", label: "Privacy" },
];
