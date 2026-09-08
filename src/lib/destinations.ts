// Static content for the footer's "Destinations" links — a full page per
// place, grounded in real geography/travel times from each Mansello home.
// No backend involved: this is fixed marketing content, not data that
// changes per booking (same reasoning as tour-packages.ts).

export interface Destination {
  slug: string;
  name: string;
  image: string;
  // Short region/area label shown above the name in the hero, e.g. "Hill
  // Country" or "Emilia-Romagna" — gives each page its own identity beyond
  // just the photo.
  eyebrow: string;
  // Travel time from the relevant Mansello home — shown as a stat pill in
  // the hero, over the destination's own photo.
  tagline: string;
  paragraphs: string[];
  // Quick-hit "don't miss" list.
  highlights: string[];
  // Practical tips — booking ahead, best time of day, how to combine it
  // with a neighbouring destination, etc.
  goodToKnow: string[];
}

export const ITALY_DESTINATIONS: Destination[] = [
  {
    slug: "modena",
    name: "Modena",
    image: "/images/destinations/modena.webp",
    eyebrow: "Emilia-Romagna",
    tagline: "About 30 minutes from The Nest Bologna",
    paragraphs: [
      "Modena is a quick, easy trip from Bologna and one of the best half-day outings in Emilia-Romagna. It's the home of true balsamic vinegar, aged for years in wooden barrels, and of Italy's fastest cars — the Ferrari and Maserati museums both trace back to the city.",
      "In the historic centre, the Modena Cathedral and its Ghirlandina tower form a UNESCO World Heritage site, and the streets around Piazza Grande are an easy, walkable way to spend an afternoon before heading back to Bologna for the evening.",
      "Modena also punches well above its weight on food — this is the city behind Osteria Francescana, chef Massimo Bottura's restaurant, repeatedly ranked among the best in the world. You don't need a reservation there to eat extremely well in Modena.",
    ],
    highlights: [
      "Museo Enzo Ferrari and the wider Ferrari/Maserati heritage",
      "Modena Cathedral & the Ghirlandina Tower (UNESCO)",
      "A traditional balsamic vinegar tasting at a family-run acetaia",
      "Piazza Grande, best seen with an evening aperitivo in hand",
    ],
    goodToKnow: [
      "Balsamic tastings at the smaller, family-run acetaie are worth booking ahead, especially on weekends.",
      "Trains from Bologna Centrale run frequently and take well under half an hour.",
    ],
  },
  {
    slug: "ferrara",
    name: "Ferrara",
    image: "/images/destinations/ferrara.jpeg",
    eyebrow: "Emilia-Romagna",
    tagline: "About 40 minutes from The Nest Bologna",
    paragraphs: [
      "Ferrara is a Renaissance city that's stayed remarkably intact — its medieval walls and cobbled streets are largely unchanged, which is exactly why the whole historic centre is a UNESCO World Heritage site.",
      "The moated Castello Estense sits right in the middle of town, and Ferrara is famously flat and bike-friendly — renting one for the day is a genuinely nice way to see it, alongside its own local specialty, cappellacci di zucca (pumpkin-filled pasta).",
      "The city also has a long, layered Jewish history, centred on its old ghetto and told in depth at the National Museum of Italian Judaism (MEIS) — one of the more thoughtful, less-crowded museum visits in the region.",
    ],
    highlights: [
      "Castello Estense, the moated castle in the city centre",
      "The UNESCO-listed Renaissance walls, walkable or cyclable in full",
      "Ferrara's historic Jewish ghetto and the MEIS museum",
      "Cappellacci di zucca — the city's own pumpkin-filled pasta",
    ],
    goodToKnow: [
      "Renting a bike at the station is the easiest way to see the city — it's famously flat, with almost no hills anywhere.",
      "Quieter than Bologna or Florence, which makes it a good choice if you want an unhurried half-day rather than a checklist of sights.",
    ],
  },
  {
    slug: "florence",
    name: "Florence",
    image: "/images/destinations/florence.png",
    eyebrow: "Tuscany",
    tagline: "About 35 minutes from The Nest Bologna by high-speed train",
    paragraphs: [
      "Florence is where the Renaissance happened, and it still shows on every street — the Duomo's dome, the Uffizi's collection of Botticelli and da Vinci, Michelangelo's David, and the Ponte Vecchio over the Arno all sit within easy walking distance of each other.",
      "It's close enough to Bologna for a full day trip by high-speed train, though it easily rewards an overnight stay if your schedule allows one.",
      "Beyond the headline sights, the Oltrarno district south of the river is worth crossing for — narrower streets, working artisan workshops, and noticeably fewer crowds than the centre.",
    ],
    highlights: [
      "Il Duomo — Brunelleschi's dome and Giotto's bell tower",
      "The Uffizi Gallery's Renaissance collection",
      "Michelangelo's David at the Accademia",
      "Ponte Vecchio and the artisan workshops of Oltrarno",
    ],
    goodToKnow: [
      "Book Uffizi and Accademia tickets online ahead of time — the walk-up queues can eat up a large part of a day trip.",
      "The historic centre is compact and best explored on foot; you won't need transport once you're there.",
    ],
  },
  {
    slug: "venice",
    name: "Venice",
    image: "/images/destinations/venice.webp",
    eyebrow: "Veneto",
    tagline: "About 1.5–2 hours from The Nest Bologna by train",
    paragraphs: [
      "There's nowhere else quite like Venice — a city built on water, with canals instead of streets and no cars anywhere in the historic centre. St Mark's Square, the Doge's Palace, and a gondola ride (or the far cheaper vaporetto water bus) are the classic way to see it.",
      "It's a longer trip than Modena or Ferrara, so it works best as a full day out from Bologna, or as an overnight stop if you want to see it without the daytime crowds.",
      "If you have the extra time, the outer islands make an easy add-on: Murano for glassblowing, Burano for its rows of brightly painted houses — both a short vaporetto ride from the main city.",
    ],
    highlights: [
      "St Mark's Square and Basilica",
      "A gondola ride through the smaller side canals",
      "Murano (glassblowing) and Burano (colourful houses) by vaporetto",
      "Getting pleasantly lost in the quieter back streets away from San Marco",
    ],
    goodToKnow: [
      "The vaporetto (water bus) is far cheaper than a private water taxi and covers the whole city, including the outer islands.",
      "An early start or a late-afternoon visit is the best way to see St Mark's Square without the cruise-ship crowds.",
    ],
  },
  {
    slug: "rome",
    name: "Rome",
    image: "/images/destinations/rome.webp",
    eyebrow: "Lazio",
    tagline: "About 2 hours from The Nest Bologna by high-speed train",
    paragraphs: [
      "Italy's capital, and one of the few cities where ancient history is just part of the everyday backdrop — the Colosseum, the Roman Forum, the Pantheon, and Vatican City with the Sistine Chapel are all within reach of each other on foot or by metro.",
      "The Frecciarossa high-speed train from Bologna makes it a genuinely comfortable day trip, though Rome has more than enough to fill several days if you have them.",
      "In the evening, Trastevere across the river is where a lot of Rome's best, least touristy food is — worth the walk over even if you've spent the whole day near the Colosseum.",
    ],
    highlights: [
      "The Colosseum and Roman Forum",
      "The Pantheon, still standing after roughly 2,000 years",
      "Vatican City and the Sistine Chapel",
      "An evening meal in Trastevere's cobbled streets",
    ],
    goodToKnow: [
      "Book Vatican Museum tickets online in advance — this is the one queue in Rome that's genuinely worth avoiding.",
      "Rome rewards slow travel more than a single rushed day — worth staying over if your schedule allows it.",
    ],
  },
  {
    slug: "naples",
    name: "Naples",
    image: "/images/destinations/naples.jpg",
    eyebrow: "Campania",
    tagline: "About 2h45–3 hours from The Nest Bologna by high-speed train",
    paragraphs: [
      "Naples is where pizza was born, and it's worth the trip for the food alone — but it's also the gateway to Pompeii, Herculaneum, and the Amalfi Coast, all within easy onward reach.",
      "It's the furthest of these on this list, so it suits an overnight stay or the start of a longer southern Italy trip rather than a rushed day out from Bologna.",
      "Naples also has a different, rawer energy than Bologna or Florence — dense, loud, and a little chaotic in the best way. Underneath it, literally, Napoli Sotterranea runs tours through the ancient tunnels and aqueducts beneath the city.",
    ],
    highlights: [
      "Real Neapolitan pizza, where the dish originated",
      "Pompeii and Herculaneum, both a short train ride away",
      "The Amalfi Coast as a scenic onward trip",
      "Napoli Sotterranea's tours through the city's underground tunnels",
    ],
    goodToKnow: [
      "The Circumvesuviana train connects Naples to both Pompeii and Sorrento, the usual gateway to the Amalfi Coast.",
      "Go in with the right expectations — Naples is grittier and more intense than Italy's more polished tourist cities, and that's a large part of its appeal.",
    ],
  },
];

export const SRI_LANKA_DESTINATIONS: Destination[] = [
  {
    slug: "kandy",
    name: "Kandy",
    image: "/images/destinations/kandy.webp",
    eyebrow: "Hill Country",
    tagline: "About 3–3.5 hours from Dona's Villa by road",
    paragraphs: [
      "Kandy is Sri Lanka's hill-country capital and its cultural heart — home to the Temple of the Sacred Tooth Relic, one of Buddhism's most revered sites, set beside the calm, walkable shoreline of Kandy Lake.",
      "It's also the usual starting point for the scenic hill-country train line onward to Ella, so many guests treat it as the first stop of a longer trip up into the hills rather than a single day trip from the villa.",
      "Just outside the city, the Royal Botanical Gardens at Peradeniya are worth the short detour, and if your dates line up with the Esala Perahera in July or August, Kandy hosts one of the island's biggest annual festivals — a procession of drummers, dancers, and decorated elephants through the streets.",
    ],
    highlights: [
      "The Temple of the Sacred Tooth Relic (Sri Dalada Maligawa)",
      "A walk around Kandy Lake at sunset",
      "The Royal Botanical Gardens at Peradeniya, just outside the city",
      "The Esala Perahera festival, if your dates fall in July/August",
    ],
    goodToKnow: [
      "The Temple of the Tooth has a dress code (shoulders and knees covered) and gets busiest around the evening puja.",
      "Kandy is the natural gateway to the hill-country train — worth combining with Ella rather than visiting on its own.",
    ],
  },
  {
    slug: "ella",
    name: "Ella",
    image: "/images/destinations/ella.jpg",
    eyebrow: "Hill Country",
    tagline: "A hill-country trip — worth an overnight stay",
    paragraphs: [
      "Ella is small hill-country town surrounded by tea plantations, best known for the Nine Arch Bridge and the short, rewarding climb up Little Adam's Peak for views over the valley.",
      "It's genuinely far from the villa by road, so it's best paired with the famous scenic train from Kandy rather than driven in a single day — most guests treat Ella as an overnight or multi-day trip into the hill country, not a day trip.",
      "For a longer, steeper alternative to Little Adam's Peak, Ella Rock rewards the extra effort with a wider view over the whole valley, and the tea plantations around town are worth a slower walk-through, not just a photo stop.",
    ],
    highlights: [
      "The Nine Arch Bridge, especially early morning when a train crosses it",
      "Little Adam's Peak for an easier sunrise or sunset walk",
      "Ella Rock for a longer, steeper hike with wider views",
      "Tea plantation walks and tastings around the town",
    ],
    goodToKnow: [
      "The Kandy–Ella train is one of the most scenic rail journeys anywhere — book seats ahead in high season, they sell out.",
      "Mornings tend to be clearer for hiking; mist often rolls in by afternoon.",
    ],
  },
  {
    slug: "badulla",
    name: "Badulla",
    image: "/images/destinations/badulla.webp",
    eyebrow: "Hill Country",
    tagline: "A hill-country trip — worth an overnight stay",
    paragraphs: [
      "Badulla sits at the end of the hill-country railway line, just past Ella, and sees far fewer visitors — a good choice if you want the same tea-country scenery with a quieter, more local pace.",
      "Dunhinda Falls, one of Sri Lanka's more impressive waterfalls, is a short trip outside town. Like Ella, it's best combined with the scenic train rather than a long day trip by road.",
      "There's less built specifically for tourists here than in Ella — fewer cafes and guesthouses aimed at visitors — which is exactly what makes it worth the extra stop if you want hill country without the crowds.",
    ],
    highlights: [
      "Dunhinda Falls, a short trip from town",
      "The end-of-the-line station on Sri Lanka's hill-country railway",
      "Quieter tea-country scenery than the busier Ella",
      "A genuine, local pace of life away from the main tourist trail",
    ],
    goodToKnow: [
      "Fewer guesthouses and restaurants cater specifically to tourists here — part of the appeal, but plan meals with that in mind.",
      "Combine with Ella on the same hill-country rail trip rather than visiting on its own.",
    ],
  },
  {
    slug: "jaffna",
    name: "Jaffna",
    image: "/images/destinations/jaffna.jpg",
    eyebrow: "Northern Province",
    tagline: "A longer trip north — worth a multi-day visit",
    paragraphs: [
      "Jaffna, at the northern tip of the island, has its own distinct Tamil culture, cuisine, and history — a genuinely different side of Sri Lanka from the south coast. Jaffna Fort and the Nallur Kandaswamy Temple are the two essential stops.",
      "It's a long way from the villa — by road, by the Yal Devi train from Colombo, or by domestic flight — so it suits guests planning a longer loop around the island rather than a side trip from Pamunugama.",
      "The food alone is worth the trip: Jaffna's crab curry is famous island-wide. If you have extra time, Delft Island, reachable by boat, is known for its wild horses and a very different, wind-swept landscape.",
    ],
    highlights: [
      "Jaffna Fort, built by the Portuguese and expanded by the Dutch",
      "Nallur Kandaswamy Temple, one of the island's most significant Hindu temples",
      "Jaffna's own cuisine, especially its crab curry",
      "Delft Island, reachable by boat, known for its wild horses",
    ],
    goodToKnow: [
      "The journey north takes real planning — by the Yal Devi train from Colombo, by road, or by domestic flight.",
      "Jaffna's pace, culture, and food are genuinely different from the south — worth treating as its own trip rather than a quick add-on.",
    ],
  },
];

export function getDestination(destinations: Destination[], slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug);
}
