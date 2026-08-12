// Static content for the three multi-day tour packages offered alongside
// Dona's Villa's transport service. Transcribed from the operator's PDF
// itineraries (Ceylon Experiences) — see repo root for the source files.
// No backend involved: this is fixed marketing content, not data that
// changes per booking.

export type TourPackageIcon = "compass" | "landmark" | "palmtree";

export interface ItineraryDay {
  day: string;
  heading: string;
  paragraphs: string[];
}

export interface HotelRow {
  place: string;
  threeStar: string;
  fourStar: string;
  fiveStar: string;
}

export interface RateRow {
  label: string;
  threeStar: string;
  fourStar: string;
  fiveStar: string;
}

export interface RatePeriod {
  label: string;
  hotels: HotelRow[];
  rates: RateRow[];
  extras: RateRow[];
}

export interface TourPackage {
  slug: string;
  title: string;
  route: string;
  duration: string;
  icon: TourPackageIcon;
  highlights: string[];
  bestFor: string;
  itinerary: ItineraryDay[];
  complementaryVisits: string[];
  inclusions: string[];
  exclusions: string[];
  remarks: string[];
  valueAdded: string[];
  ratePeriods: RatePeriod[];
}

const standardExclusions = [
  "Late check-out & early check-in charges at the hotels",
  "Any air fares + visa fees",
  "Expenses of a personal nature — laundry, mini bar charges, beverages, liquor, telephone charges, etc.",
  "Entry visa fees — please visit www.eta.gov.lk for more details",
  "Any other services not specified above",
];

const standardRemarks = [
  "Driver and car are available as per the itinerary, working strictly from 7am to 8pm.",
  "Services are available as per the itinerary only.",
  "Any personal trips outside the itinerary are at an extra cost.",
  "All late-night personal trips are chargeable extra, and the driver must be informed beforehand.",
  "The driver and company are not responsible for any personal damage occurring beyond normal working hours.",
];

const standardValueAdded = ["One bottle of water per person per day", "Garlands on arrival"];

export const tourPackages: TourPackage[] = [
  {
    slug: "classic-sri-lanka-tour",
    title: "Classic Sri Lanka Tour",
    route: "Negombo – Kandy – Nuwara Eliya – Ella – Yala – Galle – Bentota",
    duration: "06 Nights / 07 Days",
    icon: "compass",
    highlights: [
      "Airport pickup & transfer to Negombo",
      "Visit Pinnawala Elephant Orphanage & Kandy cultural show",
      "Explore Nuwara Eliya (tea country & waterfalls)",
      "Ella highlights: Nine Arch Bridge & Ravana Falls",
      "Yala National Park wildlife safari",
      "Galle Dutch Fort & Bentota beach stay",
    ],
    bestFor: "Perfect for first-time visitors who want a complete Sri Lanka experience.",
    itinerary: [
      {
        day: "Day 01",
        heading: "Airport – Negombo (approx. 25 min drive)",
        paragraphs: [
          "Arrival to Sri Lanka, welcome by our representative & transfer to Negombo.",
          "Check-in to hotel & relax. Overnight stay in Negombo.",
        ],
      },
      {
        day: "Day 02",
        heading: "Negombo – Kandy (approx. 4 hrs drive)",
        paragraphs: [
          "After breakfast, proceed to Kandy, en route visiting the Pinnawala Elephant Orphanage — a caring home for abandoned and wounded elephants, and a much-loved destination for tourists and locals alike. Adults and baby elephants thrive here under a successful captive breeding program, and feeding and bathing times are the ideal times to see them at their best.",
          "Enjoy lunch at an outside restaurant, thereafter visit the Spice Garden in Mawanella & Gem Gallery in Kandy.",
          "Check-in hotel & relax. Evening: round off the day with a Cultural Dance show, its vibrant costumes and pulsating rhythms drawn from centuries-old ritual dance forms.",
          "Dinner & overnight stay in Kandy.",
        ],
      },
      {
        day: "Day 03",
        heading: "Kandy – Nuwara Eliya (approx. 3 hrs drive)",
        paragraphs: [
          "After breakfast enjoy a city tour of Kandy — the last kingdom of the Sinhalese — taking in Upper Lake Drive and the Market Square en route to one of Sri Lanka's most sacred religious sites, the Temple of the Tooth (Dalada Maligawa), believed to house the tooth relic of the Lord Buddha. A walk around town offers souvenir hunting among treasures in wood, copper, silver, brass, ebony, bronze, ceramics, lacquer work, handlooms, batiks, jewelry and reed-ware.",
          "Thereafter head 'up country' to Nuwara Eliya, visiting the Ramboda waterfalls, Sri Bhakta Hanuman Temple and a tea factory along the way. Enjoy lunch at an outside restaurant.",
          "Nuwara Eliya — the old colonial outpost still known as 'Little England' — sits 6,200 feet above sea level, with the climate and character of an old English town: neat hedges, quaint cottages and beautiful old buildings, presided over by the magnificent Grand Hotel, complete with an old golf course and horse racing events.",
          "Visit the Sita Amman Temple, its architecture and sculpted pillars depicting the tale of Rama and Sita; Gregory Lake, a reservoir built in 1873 during the tenure of British Governor Sir William Gregory; and Victoria Park, originally part of the Hakgala Botanical Garden's research field, formally named in 1897 to mark Queen Victoria's Diamond Jubilee.",
          "Check-in hotel & relax. Dinner & overnight stay in Nuwara Eliya.",
        ],
      },
      {
        day: "Day 04",
        heading: "Nuwara Eliya – Ella – Yala (approx. 3.30 hrs drive)",
        paragraphs: [
          "After breakfast proceed to Yala via Ella, en route visiting Ravana Falls, Ravana Cave & the Nine Arch Bridge. Also visit the Hakgala Botanical Gardens (Ashok Vatika) — the exotic pleasure garden where legend holds King Ravana kept a depressed Sita, and where Hanuman's heartwarming meeting with her took place, bringing news that Rama was searching for her. Part of this majestic garden still exists today.",
          "Enjoy lunch at an outside restaurant. Ella is a quiet hill-country town beloved for its cool climate and picturesque setting deep in the 'up country,' steeped in the legend of Rama and Sita from the Ramayana — most of its natural landmarks are named after King Ravana. The cascading Ravana Ella waterfall is a breathtaking sight, Ella Rock presides over the area, and the Ella Gap mountain pass offers spectacular views across the valleys to the South Coast.",
          "Check-in hotel & relax. Dinner & overnight stay in Yala.",
        ],
      },
      {
        day: "Day 05",
        heading: "Yala – Bentota (approx. 4 hrs drive)",
        paragraphs: [
          "Morning safari at Yala National Park (05.30–09.30 AM) — Sri Lanka's most visited and second-largest national park, spanning five blocks (two open to the public), hugging the Indian Ocean along the south-east coast. Designated a wildlife sanctuary in 1900 and a national park in 1938, Yala is home to 44 mammal species and 215 bird species, including the world's largest concentration of leopards.",
          "Return to the hotel for breakfast, then proceed to Bentota via Galle. Enjoy lunch at an outside restaurant.",
          "The Heritage city of Galle has stood strong against invasions for centuries — the famous Dutch Fort, first built by the Portuguese, fortified by the Dutch and preserved by the British, has withstood over 400 years of ocean battering, including a tsunami, and its colonial walled-city architecture still holds tightly to its past glory.",
          "Check-in hotel & relax. Dinner & overnight stay in Bentota.",
        ],
      },
      {
        day: "Day 06",
        heading: "Bentota City Tour",
        paragraphs: [
          "After breakfast, enjoy a city tour of Bentota, on Sri Lanka's south coast — an area known for its birdlife, with sea birds and waders including the rare Indian Heron along the shore, and vegetation along the river hosting many local and migratory species.",
          "Highlights include the Madhu River Boat Ride, showcasing the river's remarkable biodiversity (11 species of aquatic mollusks, 14 land-dwelling mollusks, 70 fish species, 31 reptile types, 50 butterfly species and 111 identified bird species across its mangrove-formed environs), and the Turtle Hatchery at Kosgoda, a successful conservation effort protecting Sri Lanka's turtles from extinction.",
          "Enjoy lunch at an outside restaurant. Dinner & overnight stay in Bentota.",
        ],
      },
      {
        day: "Day 07",
        heading: "Bentota – Colombo – Airport (approx. 3.30 hrs drive)",
        paragraphs: [
          "After breakfast transfer to Colombo for a city tour. Sri Lanka's former capital, Colombo is the country's largest metropolis and commercial/entertainment hub, with corporate buildings, restaurants, shopping malls, spas, hotels and nightclubs. Its tree-lined main streets add to a tropical-paradise feel, and Vihara Maha Devi Park sits along the Western Coastline, famed for some of the world's best city sunsets.",
          "Enjoy lunch, then Colombo city shopping — from the bargain-priced (and busy) Pettah Bazaar to malls like Majestic City, Liberty Plaza and Crescat, plus ODEL and Arina, popular among tourists for garments, handicrafts, books and leather goods.",
          "Dinner at an outside restaurant, then transfer to the airport for your flight home — accompanied with all the happy memories of the tropical isle, Sri Lanka, once known as Taprobane.",
        ],
      },
    ],
    complementaryVisits: [
      "Spice Garden in Mawanella with complimentary head massage (on client's request)",
      "Visit Gem Museum & get free tickets to the Cultural Dance Show",
      "Kandy Lake",
      "Sri Bhakta Hanuman Temple",
      "Ramboda Falls",
      "Tea Factory",
      "Seetha Amman Temple",
      "9 Arch Bridge",
      "Ravana Falls",
      "Ravana Cave",
      "Galle Fort",
    ],
    inclusions: [
      "06 nights' accommodation on Full Board basis / dinner & breakfast at the hotel, plus 06 lunches at outside restaurants (rooms on availability basis)",
      "All transport in an air-conditioned vehicle with an English-speaking chauffeur, with all sightseeing — entry tickets included for Pinnawala Elephant Orphanage, Kandy Temple, Gregory Lake, Victoria Park, Hakgala Botanical Garden, the Yala National Park safari (including jeep), Madu River, Turtle Hatchery & Gangaramaya Temple",
      "Meals starting from Day 02 breakfast to Day 07 dinner",
      "Expressway & parking charges",
      "All local government taxes",
      "Meet & assistance at the airport",
    ],
    exclusions: standardExclusions,
    remarks: standardRemarks,
    valueAdded: standardValueAdded,
    ratePeriods: [
      {
        label: "01 Jul 2025 – 31 Aug 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Laluna Ayurveda Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "750", fourStar: "830", fiveStar: "1040" },
          { label: "4 Adults", threeStar: "615", fourStar: "695", fiveStar: "905" },
          { label: "6 Adults", threeStar: "545", fourStar: "625", fiveStar: "835" },
          { label: "8 Adults", threeStar: "505", fourStar: "585", fiveStar: "795" },
          { label: "10 Adults", threeStar: "515", fourStar: "595", fiveStar: "805" },
          { label: "10 Adults + 1 TL", threeStar: "575", fourStar: "655", fiveStar: "920" },
          { label: "15 Adults + 1 TL", threeStar: "515", fourStar: "595", fiveStar: "845" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "200", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "210", fourStar: "315", fiveStar: "270" },
          { label: "Single supplement", threeStar: "115", fourStar: "250", fiveStar: "375" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "30" },
          { label: "Lunch reduction", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
      {
        label: "01 Sep 2025 – 31 Oct 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Laluna Ayurveda Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "745", fourStar: "805", fiveStar: "1040" },
          { label: "4 Adults", threeStar: "615", fourStar: "670", fiveStar: "905" },
          { label: "6 Adults", threeStar: "540", fourStar: "600", fiveStar: "835" },
          { label: "8 Adults", threeStar: "505", fourStar: "560", fiveStar: "795" },
          { label: "10 Adults", threeStar: "510", fourStar: "565", fiveStar: "805" },
          { label: "10 Adults + 1 TL", threeStar: "575", fourStar: "645", fiveStar: "920" },
          { label: "15 Adults + 1 TL", threeStar: "515", fourStar: "570", fiveStar: "845" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "200", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "210", fourStar: "315", fiveStar: "270" },
          { label: "Single supplement", threeStar: "115", fourStar: "250", fiveStar: "375" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "30" },
          { label: "Lunch supplement", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
      {
        label: "01 Nov 2025 – 20 Dec 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Laluna Ayurveda Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "770", fourStar: "890", fiveStar: "1120" },
          { label: "4 Adults", threeStar: "640", fourStar: "770", fiveStar: "990" },
          { label: "6 Adults", threeStar: "565", fourStar: "695", fiveStar: "915" },
          { label: "8 Adults", threeStar: "530", fourStar: "655", fiveStar: "880" },
          { label: "10 Adults", threeStar: "540", fourStar: "665", fiveStar: "885" },
          { label: "10 Adults + 1 TL", threeStar: "605", fourStar: "755", fiveStar: "1005" },
          { label: "15 Adults + 1 TL", threeStar: "545", fourStar: "685", fiveStar: "1020" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "210", fourStar: "315", fiveStar: "270" },
          { label: "Single supplement", threeStar: "155", fourStar: "265", fiveStar: "470" },
          { label: "Triple reduction", threeStar: "20", fourStar: "30", fiveStar: "50" },
          { label: "Lunch reduction", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
    ],
  },
  {
    slug: "cultural-east-coast-tour",
    title: "Cultural & East Coast Tour",
    route: "Chilaw – Trincomalee – Sigiriya – Kandy – Nuwara Eliya – Yala – Bentota",
    duration: "06 Nights / 07 Days",
    icon: "landmark",
    highlights: [
      "Airport arrival & Negombo stay",
      "Visit sacred temples (Muneshwaram & Koneswaram)",
      "Trincomalee beach & cultural exploration",
      "Sigiriya rock area & spice gardens",
      "Hill country & tea plantations",
      "Yala safari & south coast beaches",
    ],
    bestFor: "Ideal for travelers who love culture, beaches and history in one trip.",
    itinerary: [
      {
        day: "Day 01",
        heading: "Airport – Negombo (approx. 25 min drive)",
        paragraphs: [
          "Arrival to Sri Lanka, welcome by our representative at the airport & proceed to Negombo.",
          "Check-in to hotel & relax. Overnight stay in Negombo.",
        ],
      },
      {
        day: "Day 02",
        heading: "Negombo – Chilaw – Trincomalee (approx. 5.30 hrs drive)",
        paragraphs: [
          "Breakfast at the hotel, then proceed to Trincomalee, en route visiting the Manavari Temple — legend holds this is where Lord Rama, advised by Lord Shiva, installed the first of four lingams (at Manavari, Thiru Koneshwaram, Thiru Ketheshwaram and Rameshwaram in India) as the remedy for the Brahmaasthi Dosham that followed him after defeating King Ravana. The Manavari lingam, near the banks of the Deduru Oya, is known as Ramalinga Shivan.",
          "Also visit the Muneshwaram Temple, believed to predate the Ramayana itself — its name meaning 'the first temple for Shiva' — where a Shiva Lingam already stood when Lord Rama visited on his journey home to Ayodhya with Sita.",
          "Enjoy lunch at an outside restaurant, then continue to Trincomalee. Check-in hotel & relax. Dinner & overnight stay in Trincomalee.",
        ],
      },
      {
        day: "Day 03",
        heading: "Trincomalee – Sigiriya – Kandy (approx. 5 hrs drive)",
        paragraphs: [
          "After breakfast, visit the Shankari Devi Shakthi Peetam — small but significant for Hindu pilgrims. The original temple, built by Ravana and once first among the 18 Ashta Dasha Shakti Pitas, was destroyed by Portuguese cannon fire, with only a commemorative pillar remaining, though its original idol is said to be preserved and venerated in a nearby rebuilt temple.",
          "Also visit the Koneswaram Temple, a classical-medieval Hindu temple dedicated to Lord Shiva, dramatically situated atop the Konesar Malai promontory overlooking the Indian Ocean, the Trincomalee coast and Trincomalee Harbour / Gokarna Bay.",
          "Enjoy lunch at an outside restaurant. Thereafter proceed to Kandy via Sigiriya, viewing Sigiriya Rock from outside the entrance, and via Matale, visiting the Herbal Spice Garden where you'll learn about Lankan spices and Ayurvedic herbs.",
          "Evening: round off the day with a Cultural Dance show, its vibrant costumes and pulsating rhythms drawn from centuries-old ritual dance forms. Dinner & overnight stay in Kandy.",
        ],
      },
      {
        day: "Day 04",
        heading: "Kandy – Nuwara Eliya (approx. 3 hrs drive)",
        paragraphs: [
          "After breakfast enjoy a city tour including the Temple of the Tooth (Dalada Maligawa) — one of Sri Lanka's most sacred sites, believed to house a tooth relic of the Lord Buddha — along with Upper Lake Drive and the Market Square, and a stroll through town for souvenirs in wood, copper, silver, brass, ebony, bronze, ceramics, lacquer, handlooms, batiks, jewelry and reed-ware.",
          "Thereafter proceed to Nuwara Eliya, en route visiting a Tea Plantation & Tea Factory, Ramboda Waterfalls and the Sri Bhakta Hanuman Temple. Enjoy lunch at an outside restaurant.",
          "Nuwara Eliya, the old colonial 'Little England,' sits 6,200 feet above sea level with the climate and character of an old English town — neat hedges, quaint cottages and stately old buildings presided over by the Grand Hotel, complete with an old golf course and horse racing.",
          "Visit the Sita Amman Temple, its architecture and statues depicting the tale of Rama and Sita, and the Hakgala Botanical Gardens (Ashok Vatika) — the legendary pleasure garden where King Ravana kept Sita, and site of her heartwarming meeting with Hanuman, who brought word that Rama was searching for her.",
          "Check-in hotel & relax. Dinner & overnight stay in Nuwara Eliya.",
        ],
      },
      {
        day: "Day 05",
        heading: "Nuwara Eliya – Ella – Yala (approx. 4 hrs drive)",
        paragraphs: [
          "After breakfast proceed to Yala via Ella, en route visiting Ravana Falls, Ravana Cave, the Nine Arch Bridge & Divurumpola. Enjoy lunch at an outside restaurant.",
          "Ella, a quiet hill-country town, draws visitors for its cool climate and picturesque setting deep in the 'up country,' steeped in the legend of Rama and Sita — its natural landmarks named after King Ravana, and its cascading Ravana Ella waterfall a breathtaking sight, with Ella Rock and the Ella Gap mountain pass offering spectacular views to the South Coast.",
          "Check-in hotel & relax. Dinner & overnight stay in Yala.",
        ],
      },
      {
        day: "Day 06",
        heading: "Yala – Bentota (approx. 5.30 hrs drive)",
        paragraphs: [
          "Morning safari at Yala National Park (05.30–09.30 AM) — Sri Lanka's most visited and second-largest national park, home to 44 mammal species and 215 bird species, including the world's biggest concentration of leopards; designated a wildlife sanctuary in 1900 and a national park in 1938.",
          "Enjoy lunch at an outside restaurant. Thereafter proceed to Bentota via Galle — the Heritage city of Galle, its Dutch Fort first built by the Portuguese, fortified by the Dutch and preserved by the British, having withstood over 400 years of ocean battering and even a tsunami.",
          "Also visit the Turtle Hatchery at Kosgoda, a successful conservation effort protecting Sri Lanka's turtles from extinction. Check-in hotel & relax. Dinner & overnight stay in Bentota.",
        ],
      },
      {
        day: "Day 07",
        heading: "Bentota City Tour – Colombo City Tour – Airport (approx. 3.30 hrs drive)",
        paragraphs: [
          "After breakfast enjoy a Bentota city tour including a Madhu River Boat Ride — the river's mangrove-formed environs support 11 species of aquatic mollusks, 14 land-dwelling mollusks, 70 fish species, 31 reptile types, 50 butterfly species and 111 identified bird species, including migratory visitors.",
          "Enjoy lunch at an outside restaurant, then proceed to Colombo for a city tour and shopping. Sri Lanka's former capital and largest metropolis, Colombo remains the commercial and entertainment hub, with tree-lined streets, a massive park along the Western Coastline famed for its sunsets, and shopping ranging from the bargain-priced Pettah Bazaar to malls like Majestic City, Liberty Plaza, Crescat, ODEL and Arina.",
          "Enjoy dinner at an outside restaurant, then transfer to Colombo Airport for your flight home.",
        ],
      },
    ],
    complementaryVisits: [
      "Munneshwaram & Manawari Temple",
      "Sri Shakari Devi Shkathi Peetham",
      "Koneshwaram Temple",
      "Spice Garden in Matale with complimentary head massage (on client's request)",
      "Visit Gem Museum & get free tickets to the Cultural Dance Show",
      "Kandy Lake",
      "Sri Bhakta Hanuman Temple",
      "Ramboda Falls",
      "Tea Factory",
      "Seetha Amman Temple",
      "9 Arch Bridge",
      "Ravana Falls",
      "Ravana Cave",
      "Divrumpola",
      "Galle Fort",
    ],
    inclusions: [
      "06 nights' accommodation on Full Board basis / dinner & breakfast at the hotel, plus 06 lunches at outside restaurants (rooms on availability basis)",
      "All transport in an air-conditioned vehicle with an English-speaking chauffeur, with all sightseeing — entry tickets included for Kandy Temple, Victoria Park, Hakgala Botanical Garden, the Yala National Park safari (including jeep), Turtle Hatchery, Madu River Boat Safari & Gangaramaya Temple",
      "Meals starting from Day 02 breakfast to Day 07 dinner",
      "Expressway & parking charges",
      "All local government taxes",
      "Meet & assistance at the airport",
    ],
    exclusions: standardExclusions,
    remarks: standardRemarks,
    valueAdded: standardValueAdded,
    ratePeriods: [
      {
        label: "01 Jul 2025 – 31 Aug 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Trincomalee — 1 night", threeStar: "Trincomalee Beach Resort (Deluxe)", fourStar: "Trinco Blu by Cinnamon (Superior)", fiveStar: "Trinco Blu by Cinnamon (Superior)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 1 night", threeStar: "Blue Beach Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "750", fourStar: "850", fiveStar: "1055" },
          { label: "4 Adults", threeStar: "615", fourStar: "715", fiveStar: "920" },
          { label: "6 Adults", threeStar: "540", fourStar: "635", fiveStar: "840" },
          { label: "8 Adults", threeStar: "500", fourStar: "595", fiveStar: "805" },
          { label: "10 Adults", threeStar: "500", fourStar: "590", fiveStar: "810" },
          { label: "10 Adults + 1 TL", threeStar: "570", fourStar: "675", fiveStar: "930" },
          { label: "15 Adults + 1 TL", threeStar: "505", fourStar: "615", fiveStar: "850" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "125", fourStar: "220", fiveStar: "395" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "35" },
          { label: "Lunch reduction", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
      {
        label: "01 Sep 2025 – 31 Oct 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Trincomalee — 1 night", threeStar: "Trincomalee Beach Resort (Deluxe)", fourStar: "Trinco Blu by Cinnamon (Superior)", fiveStar: "Trinco Blu by Cinnamon (Superior)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 1 night", threeStar: "Blue Beach Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "750", fourStar: "840", fiveStar: "1055" },
          { label: "4 Adults", threeStar: "615", fourStar: "705", fiveStar: "920" },
          { label: "6 Adults", threeStar: "540", fourStar: "630", fiveStar: "840" },
          { label: "8 Adults", threeStar: "500", fourStar: "590", fiveStar: "805" },
          { label: "10 Adults", threeStar: "500", fourStar: "585", fiveStar: "810" },
          { label: "10 Adults + 1 TL", threeStar: "570", fourStar: "665", fiveStar: "930" },
          { label: "15 Adults + 1 TL", threeStar: "505", fourStar: "635", fiveStar: "850" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "120", fourStar: "210", fiveStar: "390" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "35" },
          { label: "Lunch reduction", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
      {
        label: "01 Nov 2025 – 20 Dec 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Trincomalee — 1 night", threeStar: "Trincomalee Beach Resort (Deluxe)", fourStar: "Trinco Blu by Cinnamon (Superior)", fiveStar: "Trinco Blu by Cinnamon (Superior)" },
          { place: "Kandy — 1 night", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Yala — 1 night", threeStar: "Rain Tree by OakRay (Deluxe)", fourStar: "Chaarya Resort & Spa (Deluxe)", fiveStar: "Jetwing Yala (Superior)" },
          { place: "Bentota — 1 night", threeStar: "Blue Beach Resort (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "790", fourStar: "925", fiveStar: "1115" },
          { label: "4 Adults", threeStar: "655", fourStar: "790", fiveStar: "980" },
          { label: "6 Adults", threeStar: "575", fourStar: "715", fiveStar: "900" },
          { label: "8 Adults", threeStar: "540", fourStar: "675", fiveStar: "860" },
          { label: "10 Adults", threeStar: "545", fourStar: "670", fiveStar: "855" },
          { label: "10 Adults + 1 TL", threeStar: "615", fourStar: "765", fiveStar: "1000" },
          { label: "15 Adults + 1 TL", threeStar: "550", fourStar: "705", fiveStar: "915" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "160", fourStar: "285", fiveStar: "450" },
          { label: "Triple reduction", threeStar: "15", fourStar: "25", fiveStar: "40" },
          { label: "Lunch reduction", threeStar: "60", fourStar: "60", fiveStar: "60" },
        ],
      },
    ],
  },
  {
    slug: "highlights-leisure-tour",
    title: "Highlights + Leisure Tour",
    route: "Negombo – Kandy – Nuwara Eliya – Bentota",
    duration: "06 Nights / 07 Days",
    icon: "palmtree",
    highlights: [
      "Airport pickup & Negombo stay",
      "Kandy city tour & Temple of the Tooth",
      "Nuwara Eliya (Little England experience)",
      "White-water rafting option (Kitulgala)",
      "Bentota beach relaxation & river safari",
    ],
    bestFor: "Best for a relaxed holiday with fewer long drives.",
    itinerary: [
      {
        day: "Day 01",
        heading: "Airport – Negombo (approx. 25 min drive)",
        paragraphs: [
          "Arrival to Sri Lanka, welcome by our representative at the airport, transfer to Negombo.",
          "Check-in to hotel & relax. Overnight stay in Negombo.",
        ],
      },
      {
        day: "Day 02",
        heading: "Negombo – Kandy (approx. 4 hrs drive)",
        paragraphs: [
          "After breakfast proceed to Kandy, en route visiting the Pinnawala Elephant Orphanage — a caring home for abandoned and wounded elephants, where adults and baby elephants thrive under a successful captive breeding program, with feeding and bathing times the best opportunities to observe them.",
          "Thereafter visit the Spice Garden in Mawanella. Enjoy lunch at an outside restaurant.",
          "Check-in hotel & relax. Dinner & overnight stay in Kandy.",
        ],
      },
      {
        day: "Day 03",
        heading: "Kandy City Tour",
        paragraphs: [
          "After breakfast enjoy a city tour of Kandy, the last kingdom of the Sinhalese, taking in Upper Lake Drive and the Market Square en route to the Temple of the Tooth (Dalada Maligawa), believed to house the Lord Buddha's tooth relic; a walk around town offers souvenir hunting in wood, copper, silver, brass, ebony, bronze, ceramics, lacquer work, handlooms, batiks, jewelry and reed-ware.",
          "Afternoon visit to the Royal Botanic Gardens, Peradeniya — about 5.5km west of Kandy, near the Mahaweli River, renowned for its orchid collection, and visited by 1.2 million locals and 400,000 foreign visitors in 2016 alone.",
          "Enjoy lunch at an outside restaurant, thereafter visit the Gem Museum in Kandy. Evening: round off the day with a Cultural Dance show, its vibrant costumes and pulsating rhythms drawn from centuries-old ritual dance forms.",
          "Dinner & overnight stay in Kandy.",
        ],
      },
      {
        day: "Day 04",
        heading: "Kandy – Nuwara Eliya (approx. 3 hrs drive)",
        paragraphs: [
          "After breakfast head 'up country' to Nuwara Eliya, visiting the Ramboda waterfalls and a tea factory along the way.",
          "Afternoon: the old colonial outpost still known as 'Little England,' Nuwara Eliya sits 6,200 feet above sea level with the climate and character of an old English town — neat hedges, quaint cottages and beautiful old buildings presided over by the magnificent Grand Hotel, with an old golf course and horse racing events completing the picture. Enjoy lunch at an outside restaurant.",
          "Visit the Sita Amman Temple, its architecture and statues depicting the tale of Rama and Sita; Gregory Lake, a reservoir built in 1873 during the tenure of British Governor Sir William Gregory; and Victoria Park, formally named in 1897 to commemorate Queen Victoria's Diamond Jubilee.",
          "Check-in hotel & relax. Dinner & overnight stay in Nuwara Eliya.",
        ],
      },
      {
        day: "Day 05",
        heading: "Nuwara Eliya – Bentota (approx. 5.30 hrs drive)",
        paragraphs: [
          "Morning: after breakfast head to the resort town of Bentota via Kitulgala. For the adventurous, White-Water Rafting awaits at Kitulgala — a 5km run on the picturesque Kelani River covering 5 major and 4 minor rapids, with safety gear, modern rafts and a full safety briefing from instructors beforehand. Those who prefer to stay dry can relax and admire the views instead.",
          "Enjoy lunch at an outside restaurant & transfer to Bentota. Check-in hotel & relax. Dinner & overnight stay in Bentota.",
        ],
      },
      {
        day: "Day 06",
        heading: "Bentota – Galle City Tour & Bentota City Tour",
        paragraphs: [
          "After breakfast proceed to Galle & visit Galle Fort — the Heritage city of Galle, its Dutch Fort first built by the Portuguese, fortified by the Dutch and preserved by the British, has withstood over 400 years of ocean battering, including a tsunami, and its colonial walled-city architecture still holds tightly to its past glory.",
          "Enjoy lunch at an outside restaurant. Bentota, on Sri Lanka's south coast, is known for its birdlife — sea birds and waders including the rare Indian Heron along the shore, and local and migratory species along the river.",
          "Highlights include the Madhu River Boat Ride, showcasing remarkable biodiversity (11 species of aquatic mollusks, 14 land-dwelling mollusks, 70 fish species, 31 reptile types, 50 butterfly species and 111 identified bird species), and the Turtle Hatchery at Kosgoda, a successful conservation effort protecting Sri Lanka's turtles from extinction.",
          "Dinner & overnight stay in Bentota.",
        ],
      },
      {
        day: "Day 07",
        heading: "Bentota – Colombo – Airport (approx. 3.30 hrs drive)",
        paragraphs: [
          "After breakfast proceed to Colombo & enjoy a Colombo city tour & shopping, including the Gangaramaya Temple. Sri Lanka's former capital and largest metropolis, Colombo remains the country's commercial and entertainment hub, with tree-lined main streets, and a massive park along the Western Coastline famed for its sunsets.",
          "Enjoy lunch, then Colombo city shopping — from the bargain-priced Pettah Bazaar to malls like Majestic City, Liberty Plaza, Crescat, ODEL and Arina.",
          "Enjoy dinner at an outside restaurant, then proceed to Colombo Airport for your flight home.",
        ],
      },
    ],
    complementaryVisits: [
      "Spice Garden in Mawanella with complimentary head massage (on client's request)",
      "Visit Gem Museum & get free tickets to the Cultural Dance Show",
      "Kandy Lake",
      "Ramboda Falls",
      "Tea Factory",
      "Seetha Amman Temple",
      "Galle Fort",
    ],
    inclusions: [
      "06 nights' accommodation on Full Board basis / dinner & breakfast at the hotel, plus 06 lunches at outside restaurants (rooms on availability basis)",
      "All transport in an air-conditioned vehicle with an English-speaking chauffeur, with all sightseeing — entry tickets included for Pinnawala Elephant Orphanage, Kandy Temple, Royal Botanical Garden, Gregory Lake, Victoria Park, White Water Rafting at Kitulgala, Madu River Boat Ride, Turtle Hatchery & Gangaramaya Temple",
      "Meals starting from Day 02 breakfast to Day 07 dinner",
      "Expressway & parking charges",
      "All local government taxes",
      "Meet & assistance at the airport",
    ],
    exclusions: standardExclusions,
    remarks: standardRemarks,
    valueAdded: standardValueAdded,
    ratePeriods: [
      {
        label: "01 Jul 2025 – 31 Aug 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 2 nights", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Blue Beach Hotel (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "675", fourStar: "755", fiveStar: "885" },
          { label: "4 Adults", threeStar: "545", fourStar: "625", fiveStar: "755" },
          { label: "6 Adults", threeStar: "475", fourStar: "550", fiveStar: "680" },
          { label: "8 Adults", threeStar: "435", fourStar: "515", fiveStar: "645" },
          { label: "10 Adults", threeStar: "445", fourStar: "520", fiveStar: "650" },
          { label: "10 Adults + 1 TL", threeStar: "495", fourStar: "590", fiveStar: "745" },
          { label: "15 Adults + 1 TL", threeStar: "440", fourStar: "530", fiveStar: "675" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "105", fourStar: "185", fiveStar: "295" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "30" },
        ],
      },
      {
        label: "01 Sep 2025 – 31 Oct 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 2 nights", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Blue Beach Hotel (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "675", fourStar: "735", fiveStar: "860" },
          { label: "4 Adults", threeStar: "545", fourStar: "605", fiveStar: "730" },
          { label: "6 Adults", threeStar: "475", fourStar: "530", fiveStar: "655" },
          { label: "8 Adults", threeStar: "435", fourStar: "495", fiveStar: "620" },
          { label: "10 Adults", threeStar: "445", fourStar: "500", fiveStar: "625" },
          { label: "10 Adults + 1 TL", threeStar: "495", fourStar: "570", fiveStar: "715" },
          { label: "15 Adults + 1 TL", threeStar: "440", fourStar: "505", fiveStar: "645" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "105", fourStar: "180", fiveStar: "270" },
          { label: "Triple reduction", threeStar: "15", fourStar: "20", fiveStar: "25" },
        ],
      },
      {
        label: "01 Nov 2025 – 20 Dec 2025",
        hotels: [
          { place: "Negombo — 1 night", threeStar: "Beacon Beach Hotel (Deluxe)", fourStar: "Earl's Regent Negombo (Deluxe)", fiveStar: "Jetwing Blue (Deluxe)" },
          { place: "Kandy — 2 nights", threeStar: "Rivendell Hotel (Deluxe)", fourStar: "Randholee Resort & Spa (Deluxe)", fiveStar: "The Golden Crown (Deluxe)" },
          { place: "Nuwara Eliya — 1 night", threeStar: "Single Tree Mount Hotel (Deluxe)", fourStar: "Blackpool Hotel (Deluxe)", fiveStar: "Araliya Green City (Superior)" },
          { place: "Bentota — 2 nights", threeStar: "Blue Beach Hotel (Deluxe)", fourStar: "The Palms (Deluxe)", fiveStar: "Citrus Waskaduwa (Superior)" },
        ],
        rates: [
          { label: "2 Adults", threeStar: "710", fourStar: "840", fiveStar: "955" },
          { label: "4 Adults", threeStar: "580", fourStar: "710", fiveStar: "825" },
          { label: "6 Adults", threeStar: "505", fourStar: "635", fiveStar: "750" },
          { label: "8 Adults", threeStar: "470", fourStar: "600", fiveStar: "715" },
          { label: "10 Adults", threeStar: "475", fourStar: "605", fiveStar: "720" },
          { label: "10 Adults + 1 TL", threeStar: "540", fourStar: "690", fiveStar: "825" },
          { label: "15 Adults + 1 TL", threeStar: "480", fourStar: "625", fiveStar: "750" },
        ],
        extras: [
          { label: "Child without bed", threeStar: "140", fourStar: "170", fiveStar: "195" },
          { label: "Child with extra bed", threeStar: "200", fourStar: "230", fiveStar: "270" },
          { label: "Single supplement", threeStar: "140", fourStar: "245", fiveStar: "345" },
          { label: "Triple reduction", threeStar: "15", fourStar: "25", fiveStar: "35" },
        ],
      },
    ],
  },
];

export function getTourPackage(slug: string): TourPackage | undefined {
  return tourPackages.find((p) => p.slug === slug);
}
