import type { CreateTestimonialInput } from "./api/types";

// One-time seed data for the admin Testimonials page's "Seed Existing
// Reviews" button. These are the real guest reviews both sites launched
// with, back when they were hardcoded directly into
// components/*/testimonials.tsx — moved here so they have somewhere to
// live now that those components fetch exclusively from the database (see
// BACKEND_CHANGES_TESTIMONIALS.md). Not used anywhere at runtime other than
// that one button; once seeded, the database is the only source of truth.

export const ITALY_SEED_TESTIMONIALS: CreateTestimonialInput[] = [
  {
    site: "italy",
    name: "Sanjay",
    role: "Booking.com Guest, Germany",
    quote:
      "I would recommend this place to everyone, especially those coming to attend fairs, due to proximity. The property had everything one can expect and more — a large approx. 60″ TV, a fully functional kitchen with cutlery, two ACs, easy-to-connect WiFi, and a bath tub in addition to a shower. It made my stay comfortable for a very decent price. I would definitely book this again!",
    rating: 5,
    sortOrder: 0,
    active: true,
  },
  {
    site: "italy",
    name: "Gaia",
    role: "Airbnb Guest · 1 night",
    quote:
      "I stayed at this accommodation for one night and was extremely satisfied. The house was cosy, clean and equipped with everything you need for a comfortable stay. The hosts were always kind and helpful.",
    rating: 5,
    sortOrder: 1,
    active: true,
  },
  {
    site: "italy",
    name: "Kelaure Breldy Pavel",
    role: "Airbnb Guest · 1 night",
    quote:
      "Beautiful apartment in a quiet area, equipped with everything you need. Exactly as described. Don and his parents were very welcoming and kind. Good value for money. It was like being at home. Highly recommended.",
    rating: 5,
    sortOrder: 2,
    active: true,
  },
  {
    site: "italy",
    name: "Mylie",
    role: "Airbnb Guest · 1 night",
    quote: "Super big nice place with air con and all you need.",
    rating: 5,
    sortOrder: 3,
    active: true,
  },
];

export const SRI_LANKA_SEED_TESTIMONIALS: CreateTestimonialInput[] = [
  {
    site: "sri_lanka",
    name: "Anuke",
    role: "Airbnb Guest · 1 night",
    quote:
      "This was a serene stay in a beautiful villa all to ourselves. Nilanthi was always responsive. Her cousin, Samantha, is the caretaker and also an excellent chef — we ordered meals through her and they were excellent. The villa is a short walk to the beach where we swam and enjoyed the sunset.",
    rating: 5,
    sortOrder: 0,
    active: true,
  },
  {
    site: "sri_lanka",
    name: "Sanowar",
    role: "Airbnb Guest · 10 nights",
    quote:
      "The house feels like home, really comfortable and calm. They have everything for your living. The host is really responsive and helpful — they even provided our extra needs as a complement. Highly recommended this house.",
    rating: 5,
    sortOrder: 1,
    active: true,
  },
  {
    site: "sri_lanka",
    name: "Aleksandr",
    role: "Airbnb Guest · 3 nights",
    quote:
      "The villa is very spacious and has a private yard. A lot of beaches are nearby. The church is nearby. People are friendly. Peaceful and quiet place.",
    rating: 5,
    sortOrder: 2,
    active: true,
  },
  {
    site: "sri_lanka",
    name: "Ritu",
    role: "Airbnb Guest · 2 nights",
    quote:
      "Quite a peaceful stay! N Akka helped with everything. Very comfortable for solo female travellers too. Beautiful home!",
    rating: 5,
    sortOrder: 3,
    active: true,
  },
  {
    site: "sri_lanka",
    name: "Punith",
    role: "Airbnb Guest · 1 night",
    quote:
      "Very good, cosy stay if you're looking around the airport — very near to the beach and the village. Very accessible, with a good number of rooms, kitchen and bathroom. Thank you for hosting us, I would highly recommend this place.",
    rating: 5,
    sortOrder: 4,
    active: true,
  },
  {
    site: "sri_lanka",
    name: "Naveen",
    role: "Airbnb Guest · 1 night",
    quote:
      "The place was very neat, clean, and well organized. Everything was as expected and absolutely worth the money. Would definitely recommend!",
    rating: 5,
    sortOrder: 5,
    active: true,
  },
];
