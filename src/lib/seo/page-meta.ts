import type { SeoConfig } from "./use-seo";

// Metadata for the fixed (non-parameterised) routes, kept in one place so the
// whole site's titles and descriptions can be reviewed at a glance.
//
// Every description is drawn from facts already stated on the page itself —
// guest counts, travel times, and locations come from the visible copy in the
// welcome/hero components. Nothing here asserts anything a visitor can't read
// on the page.
//
// Routes with a `:slug`/`:id` parameter build their metadata in the page
// component instead, since it depends on fetched or looked-up data.

type StaticMeta = Omit<SeoConfig, "path"> & { path: string };

const meta = <T extends Record<string, StaticMeta>>(m: T) => m;

export const PAGE_META = meta({
  home: {
    path: "/",
    title: "Mansello | Your Home Away From Home",
    description:
      "Mansello offers warm, family-run stays in two countries — an apartment in Bologna, Italy and a villa near Colombo, Sri Lanka.",
    image: "/images/hero-bg.webp",
  },

  // --- Italy ---------------------------------------------------------------
  italyHome: {
    path: "/italy",
    title: "Stay in Bologna, Italy",
    description:
      "The Nest Bologna — a fully equipped apartment for 1–4 guests, 10 minutes from Bologna Main Station and 5 minutes from Bologna Fiera.",
    image: "/images/italy-bg.jpg",
  },
  italyAbout: {
    path: "/italy/about",
    title: "About Our Bologna Home",
    description:
      "Meet the family behind The Nest Bologna, and discover the corner of Emilia-Romagna our guests explore from our door.",
  },
  italyAirbnb: {
    path: "/italy/airbnb",
    title: "The Nest Bologna — Apartment Booking",
    description:
      "Book The Nest Bologna: an apartment for 1–4 guests with a fully equipped kitchen, 13 minutes from Bologna Guglielmo Marconi Airport (BLQ).",
    image: "/images/italy/nest-bologna/nest-bologna-living-room-1.webp",
  },
  italyBlog: {
    path: "/italy/blog",
    title: "Bologna Travel Notes",
    description:
      "Stories, tips, and local recommendations for travellers staying with us in Bologna and exploring northern Italy.",
  },
  italyContact: {
    path: "/italy/contact",
    title: "Contact Us in Bologna",
    description:
      "Get in touch with Mansello in Bologna — questions about availability, the apartment, or planning your stay in Emilia-Romagna.",
  },
  italyTerms: {
    path: "/italy/terms",
    title: "Terms & Conditions — Italy",
    description:
      "Booking terms, payment and cancellation conditions, house rules, and tourist-tax information for stays at The Nest Bologna.",
  },
  italyPrivacy: {
    path: "/italy/privacy",
    title: "Privacy Policy — Italy",
    description:
      "How Mansello collects, uses, and protects your personal data for our Italian bookings, and your rights under GDPR.",
  },

  // --- Sri Lanka -----------------------------------------------------------
  sriLankaHome: {
    path: "/sri-lanka",
    title: "Stay in Pamunugama, Sri Lanka",
    description:
      "Dona's Villa — air-conditioned rooms for 1–8 guests, 25 minutes from Colombo Airport (CMB), with airport pick-up and drop-off available.",
    image: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
  },
  sriLankaAbout: {
    path: "/sri-lanka/about",
    title: "About Our Sri Lanka Home",
    description:
      "Meet the family behind Dona's Villa in Pamunugama, and the stretch of coast near Negombo and Colombo our guests explore.",
  },
  sriLankaAirbnb: {
    path: "/sri-lanka/airbnb",
    title: "Dona's Villa — Room Booking",
    description:
      "Book a room at Dona's Villa: air-conditioned rooms for 1–8 guests, 25 minutes from Colombo Airport (CMB), with airport transfers available.",
    image: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
  },
  sriLankaBlog: {
    path: "/sri-lanka/blog",
    title: "Sri Lanka Travel Notes",
    description:
      "Stories, tips, and local recommendations for travellers staying with us in Sri Lanka — from the coast to the hill country.",
  },
  sriLankaContact: {
    path: "/sri-lanka/contact",
    title: "Contact Us in Sri Lanka",
    description:
      "Get in touch with Mansello in Sri Lanka — questions about rooms, airport transfers, tour packages, or planning your trip.",
  },
  sriLankaTransport: {
    path: "/sri-lanka/transport",
    title: "Sri Lanka Airport Transfers & Tour Packages",
    description:
      "Fixed-price transfers from Colombo Airport (CMB) and multi-day tour packages across Sri Lanka, arranged by drivers we know and trust.",
    image: "/images/sri-lanka/transport/hero-transport.webp",
  },
  sriLankaTerms: {
    path: "/sri-lanka/terms",
    title: "Terms & Conditions — Sri Lanka",
    description:
      "Booking terms, payment and cancellation conditions, and house rules for stays, transfers, and tours with Mansello Sri Lanka.",
  },
  sriLankaPrivacy: {
    path: "/sri-lanka/privacy",
    title: "Privacy Policy — Sri Lanka",
    description:
      "How Mansello collects, uses, and protects your personal data for our Sri Lanka bookings, transfers, and marketplace orders.",
  },

  // --- Marketplace ---------------------------------------------------------
  marketplace: {
    path: "/sri-lanka/marketplace",
    title: "The Mansello Marketplace",
    description:
      "Shop the pantry we cook from — a small, curated range you can order online and have delivered.",
  },

  // --- Transactional: valuable to users, worthless (or unsafe) in search ----
  marketplaceCart: {
    path: "/sri-lanka/marketplace/cart",
    title: "Your Cart",
    description: "Review the items in your Mansello Marketplace cart before checkout.",
    noindex: true,
  },
  marketplaceCheckout: {
    path: "/sri-lanka/marketplace/checkout",
    title: "Checkout",
    description: "Complete your Mansello Marketplace order.",
    noindex: true,
  },
  italyBookingConfirmation: {
    path: "/italy/booking/confirmation",
    title: "Booking Confirmation",
    description: "Your booking confirmation for The Nest Bologna.",
    noindex: true,
  },
  sriLankaBookingConfirmation: {
    path: "/sri-lanka/booking/confirmation",
    title: "Booking Confirmation",
    description: "Your booking confirmation for Dona's Villa.",
    noindex: true,
  },
});

/** Metadata for pages that must never be indexed and carry no shareable content. */
export const PRIVATE_META = {
  order: (id: string): SeoConfig => ({
    path: `/sri-lanka/marketplace/order/${id}`,
    title: "Your Order",
    description: "Mansello Marketplace order details.",
    noindex: true,
  }),
  bookingInfo: (): SeoConfig => ({
    path: "/booking-info",
    title: "Guest Information",
    description: "Complete your guest information for your upcoming stay.",
    noindex: true,
  }),
  admin: (label: string): SeoConfig => ({
    path: "/admin",
    // Deliberately generic: this is set once on the shared admin layout, so it
    // can't name the individual screen without a call in every admin page.
    title: `Mansello ${label}`,
    description: "Mansello staff administration.",
    noindex: true,
  }),
};
