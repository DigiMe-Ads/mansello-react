// Editable site content.
//
// This file is the single source of truth for BOTH what the admin Content tab
// can edit AND what the site falls back to when nothing has been saved. The
// `default` of every field below is the exact copy/image that was previously
// hardcoded in the component, so an untouched install renders identically to
// before this feature existed — and the "Restore defaults" button in the admin
// panel just writes these values back.
//
// Adding a new editable field is two steps:
//   1. add a field here with its current hardcoded value as `default`
//   2. swap the hardcoded value in the component for `c("<key>")`
//
// Keys are `<scope>.<section>.<field>`. See BACKEND_CHANGES_SITE_CONTENT.md.

export type ContentFieldType = "text" | "textarea" | "image" | "url";

export interface ContentField {
  key: string;
  label: string;
  help?: string;
  type: ContentFieldType;
  default: string;
}

export interface ContentSection {
  id: string;
  title: string;
  description?: string;
  /** Which site this section belongs to. "global" shows on both. */
  scope: "global" | "italy" | "sri_lanka";
  fields: ContentField[];
}

export const CONTENT_SECTIONS: ContentSection[] = [
  // --- Global ---------------------------------------------------------------
  {
    id: "brand",
    title: "Logo & Branding",
    description: "Used in the navigation bar and footer on both sites.",
    scope: "global",
    fields: [
      {
        key: "global.brand.logo",
        label: "Logo",
        help: "Shown in the header and footer. A transparent PNG or WebP works best.",
        type: "image",
        default: "/images/logo.webp",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Details",
    description:
      "Shown in both footers and on the contact pages. Changing these here updates every place they appear.",
    scope: "global",
    fields: [
      {
        key: "global.contact.email",
        label: "Email address",
        type: "text",
        default: "info@mansello.com",
      },
      {
        key: "global.contact.italyPhone",
        label: "Italy phone number",
        type: "text",
        default: "+39 380 348 8663",
      },
      {
        key: "global.contact.sriLankaPhone",
        label: "Sri Lanka phone number",
        type: "text",
        default: "+94 74 102 4320",
      },
      {
        key: "global.contact.italyAddress",
        label: "Italy postal address",
        type: "textarea",
        help: "Line breaks are preserved as shown.",
        default: "Via Alfredo Calzolari 12,\n40128 Bologna, Italy",
      },
      {
        key: "global.contact.sriLankaAddress",
        label: "Sri Lanka postal address",
        type: "textarea",
        help: "Line breaks are preserved as shown.",
        default: "No. 187, Kepungoda,\nPamunugama, Sri Lanka",
      },
    ],
  },
  {
    id: "social",
    title: "Social Media Links",
    description: "Full URLs, including https://. Leave blank to hide that icon.",
    scope: "global",
    fields: [
      {
        key: "global.social.italyFacebook",
        label: "Italy — Facebook URL",
        type: "url",
        default: "https://www.facebook.com/share/1BnvnhryFX/?mibextid=wwXIfr",
      },
      {
        key: "global.social.italyInstagram",
        label: "Italy — Instagram URL",
        type: "url",
        default: "https://www.instagram.com/thenestbologna?utm_source=qr",
      },
      {
        key: "global.social.sriLankaFacebook",
        label: "Sri Lanka — Facebook URL",
        type: "url",
        default: "https://www.facebook.com/share/1ESsmm1RzM/?mibextid=wwXIfr",
      },
      {
        key: "global.social.sriLankaInstagram",
        label: "Sri Lanka — Instagram URL",
        type: "url",
        default: "https://www.instagram.com/mansellosrilanka?utm_source=qr",
      },
    ],
  },

  // --- Italy ----------------------------------------------------------------
  {
    id: "italy-hero",
    title: "Homepage Hero",
    description: "The full-screen banner at the top of the Italy homepage.",
    scope: "italy",
    fields: [
      {
        key: "italy.hero.eyebrow",
        label: "Small text above the headline",
        type: "text",
        default: "Explore",
      },
      {
        key: "italy.hero.title",
        label: "Headline",
        help: "Shown in the large script font.",
        type: "text",
        default: "Italy",
      },
      {
        key: "italy.hero.body",
        label: "Paragraph under the headline",
        type: "textarea",
        default:
          "Stay at The Nest Bologna — your cosy retreat in the heart of Emilia-Romagna. Enjoy comfortable rooms, warm hospitality, and easy access to Bologna Guglielmo Marconi Airport, all in one place.",
      },
      {
        key: "italy.hero.ctaLabel",
        label: "Button text",
        type: "text",
        default: "Book Your Stay",
      },
      {
        key: "italy.hero.backgroundImage",
        label: "Background photo",
        help: "Full-width behind the headline. Use a wide, high-resolution photo.",
        type: "image",
        default: "/images/italy-bg.jpg",
      },
    ],
  },
  {
    id: "italy-welcome",
    title: "Welcome Section",
    description: "The introduction section below the hero on the Italy homepage.",
    scope: "italy",
    fields: [
      {
        key: "italy.welcome.title",
        label: "Section heading",
        type: "text",
        default: "Welcome to The Nest Bologna",
      },
      {
        key: "italy.welcome.paragraph1",
        label: "First paragraph",
        type: "textarea",
        default:
          "Tucked into a quiet residential corner of Bologna, The Nest is a cosy, family-run stay built around one idea: arriving in Italy should feel like coming home.",
      },
      {
        key: "italy.welcome.paragraph2",
        label: "Second paragraph",
        type: "textarea",
        default:
          "Wake up minutes from Bologna's historic centre and reach Bologna Guglielmo Marconi Airport with ease — perfect for your first or last night in the food capital of Italy, or as a relaxed base to explore Emilia-Romagna.",
      },
      {
        key: "italy.welcome.highlights",
        label: "Highlights list",
        help: "One per line. These appear as the bulleted list beside the photos.",
        type: "textarea",
        default: [
          "Apartment for 1–4 guests",
          "Fully equipped kitchen",
          "10 minutes from Bologna Main Station",
          "5 minutes from Bologna Fiera",
          "13 minutes from Bologna Guglielmo Marconi Airport (BLQ)",
        ].join("\n"),
      },
      {
        key: "italy.welcome.image1",
        label: "Photo 1",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-living-room-1.webp",
      },
      {
        key: "italy.welcome.image2",
        label: "Photo 2",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-bedroom-1.webp",
      },
      {
        key: "italy.welcome.image3",
        label: "Photo 3",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-kitchen-1.webp",
      },
      {
        key: "italy.welcome.image4",
        label: "Photo 4",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-exterior-1.webp",
      },
    ],
  },
  {
    id: "italy-villa-photos",
    title: "Villa Photos",
    description:
      "Every other photo of The Nest Bologna shown across the site — page banners, the \"Our Home\" section, and the photo gallery.",
    scope: "italy",
    fields: [
      {
        key: "italy.villaPhotos.aboutHero",
        label: "About page banner",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-exterior-3.webp",
      },
      {
        key: "italy.villaPhotos.heroImage",
        label: "Contact / Privacy / Terms page banner",
        help: "Shared across all three pages.",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-exterior-1.webp",
      },
      {
        key: "italy.villaPhotos.ourHomeImage1",
        label: "\"Our Home\" — Exterior photo",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-exterior-3.webp",
      },
      {
        key: "italy.villaPhotos.ourHomeImage2",
        label: "\"Our Home\" — Living Room photo",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-bedroom-2.webp",
      },
      {
        key: "italy.villaPhotos.ourHomeImage3",
        label: "\"Our Home\" — Kitchen photo",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-decor-2.webp",
      },
      {
        key: "italy.villaPhotos.galleryImage1",
        label: "Gallery photo 1",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-living-room-1.webp",
      },
      {
        key: "italy.villaPhotos.galleryImage2",
        label: "Gallery photo 2",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-bedroom-1.webp",
      },
      {
        key: "italy.villaPhotos.galleryImage3",
        label: "Gallery photo 3",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-kitchen-bright.jpeg",
      },
      {
        key: "italy.villaPhotos.galleryImage4",
        label: "Gallery photo 4",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-courtyard-entrance.jpeg",
      },
      {
        key: "italy.villaPhotos.galleryImage5",
        label: "Gallery photo 5",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-living-room-chandelier.jpeg",
      },
      {
        key: "italy.villaPhotos.galleryImage6",
        label: "Gallery photo 6",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-bathroom-1.webp",
      },
      {
        key: "italy.villaPhotos.storyImage1",
        label: "\"Two Homes\" section — small circular photo",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-living-room-3.webp",
      },
      {
        key: "italy.villaPhotos.storyImage2",
        label: "\"Two Homes\" section — large circular photo",
        type: "image",
        default: "/images/italy/nest-bologna/nest-bologna-courtyard-entrance.jpeg",
      },
    ],
  },

  // --- Sri Lanka ------------------------------------------------------------
  {
    id: "sri-lanka-hero",
    title: "Homepage Hero",
    description: "The full-screen banner at the top of the Sri Lanka homepage.",
    scope: "sri_lanka",
    fields: [
      {
        key: "sri_lanka.hero.eyebrow",
        label: "Small text above the headline",
        type: "text",
        default: "Explore",
      },
      {
        key: "sri_lanka.hero.title",
        label: "Headline",
        help: "Shown in the large script font.",
        type: "text",
        default: "Sri Lanka",
      },
      {
        key: "sri_lanka.hero.body",
        label: "Paragraph under the headline",
        type: "textarea",
        default:
          "Stay at Dona's Villa — your peaceful coastal retreat just 25 minutes from Colombo Airport. Comfortable rooms and reliable airport transfers, all in one place.",
      },
      {
        key: "sri_lanka.hero.ctaLabel",
        label: "Button text",
        type: "text",
        default: "Book Your Stay",
      },
      {
        key: "sri_lanka.hero.backgroundImage",
        label: "Background photo",
        help: "Full-width behind the headline. Use a wide, high-resolution photo.",
        type: "image",
        default: "/images/bg.webp",
      },
    ],
  },
  {
    id: "sri-lanka-welcome",
    title: "Welcome Section",
    description: "The introduction section below the hero on the Sri Lanka homepage.",
    scope: "sri_lanka",
    fields: [
      {
        key: "sri_lanka.welcome.title",
        label: "Section heading",
        type: "text",
        default: "Welcome to Dona's Villa",
      },
      {
        key: "sri_lanka.welcome.paragraph1",
        label: "First paragraph",
        type: "textarea",
        default:
          "Tucked away in the quiet fishing village of Pamunugama, between the Negombo lagoon and the Indian Ocean, Dona's Villa is a cosy, family-run stay built around one idea: arriving in Sri Lanka should feel like coming home.",
      },
      {
        key: "sri_lanka.welcome.paragraph2",
        label: "Second paragraph",
        type: "textarea",
        default:
          "Wake up to birdsong and reach Bandaranaike International Airport in around 25 minutes — perfect for your first or last night on the island, or as a relaxed base near Colombo and Negombo.",
      },
      {
        key: "sri_lanka.welcome.highlights",
        label: "Highlights list",
        help: "One per line. These appear as the bulleted list beside the photos.",
        type: "textarea",
        default: [
          "Rooms for 1–8 guests",
          "25 minutes from Colombo Airport (CMB)",
          "Airport pick-up and drop-off available",
          "Air-conditioned rooms",
        ].join("\n"),
      },
      {
        key: "sri_lanka.welcome.image1",
        label: "Photo 1",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
      },
      {
        key: "sri_lanka.welcome.image2",
        label: "Photo 2",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-garden-1.webp",
      },
      {
        key: "sri_lanka.welcome.image3",
        label: "Photo 3",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-veranda-1.webp",
      },
      {
        key: "sri_lanka.welcome.image4",
        label: "Photo 4",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-garden-pathway-1.webp",
      },
    ],
  },
  {
    id: "sri-lanka-villa-photos",
    title: "Villa Photos",
    description:
      "Every other photo of Dona's Villa shown across the site — page banners, the \"Our Home\" section, and the photo gallery.",
    scope: "sri_lanka",
    fields: [
      {
        key: "sri_lanka.villaPhotos.heroImage",
        label: "Villa / Privacy / Terms page banner",
        help: "Shared across all three pages.",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-facade-bright.jpeg",
      },
      {
        key: "sri_lanka.villaPhotos.ourHomeImage1",
        label: "\"Our Home\" — Exterior photo",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
      },
      {
        key: "sri_lanka.villaPhotos.ourHomeImage2",
        label: "\"Our Home\" — Living Room photo",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-living-room-1.webp",
      },
      {
        key: "sri_lanka.villaPhotos.ourHomeImage3",
        label: "\"Our Home\" — Kitchen photo",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-kitchen-dining-1.webp",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage1",
        label: "Gallery photo 1",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-living-room-1.webp",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage2",
        label: "Gallery photo 2",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-bedroom-bright.jpeg",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage3",
        label: "Gallery photo 3",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-kitchen-dining-2.jpeg",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage4",
        label: "Gallery photo 4",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-exterior-front-facade.webp",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage5",
        label: "Gallery photo 5",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/new/dona-villa-living-room-seating-area.jpeg",
      },
      {
        key: "sri_lanka.villaPhotos.galleryImage6",
        label: "Gallery photo 6",
        type: "image",
        default: "/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-bathroom-1.webp",
      },
      {
        key: "sri_lanka.villaPhotos.storyImage1",
        label: "\"Two Homes\" section — small circular photo",
        type: "image",
        default: "/images/sri-lanka/about/homes/villa-living-room.webp",
      },
      {
        key: "sri_lanka.villaPhotos.storyImage2",
        label: "\"Two Homes\" section — large circular photo",
        type: "image",
        default: "/images/sri-lanka/about/homes/villa-garden-day.jpeg",
      },
    ],
  },
];

/** Every field, flattened — used for lookups and for seeding. */
export const CONTENT_FIELDS: ContentField[] = CONTENT_SECTIONS.flatMap((s) => s.fields);

/** key -> hardcoded default. The fallback whenever nothing is saved. */
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f.default])
);

/** Splits a newline-separated textarea field into a list, ignoring blank lines. */
export function contentLines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
