/*
  AREAS WE SERVE.
  This one array drives two things:
    1. The clickable town tiles on the homepage
    2. The dynamic route at /areas/[slug] — add a town here and Next.js
       automatically builds a new SEO landing page for it. No new code.
  Counties verified against the towns' actual locations.
*/

export type Area = {
  slug: string;
  name: string;
  county: "Nassau" | "Suffolk" | "Queens";
  blurb: string;
};

export const areas: Area[] = [
  {
    slug: "franklin-square",
    name: "Franklin Square",
    county: "Nassau",
    blurb:
      "Home base — our Nassau office has been on Hempstead Turnpike since 2001. Capes, colonials, and ranches on quiet residential blocks, and nobody knows this market better.",
  },
  {
    slug: "floral-park",
    name: "Floral Park",
    county: "Nassau",
    blurb:
      "A village feel on the Queens border with a walkable downtown, LIRR access, and tree-lined streets of well-kept colonials and Tudors.",
  },
  {
    slug: "garden-city",
    name: "Garden City",
    county: "Nassau",
    blurb:
      "One of Long Island's signature communities — stately Tudors and colonials, a classic downtown, and consistently strong demand.",
  },
  {
    slug: "valley-stream",
    name: "Valley Stream",
    county: "Nassau",
    blurb:
      "A favorite first stop for buyers leaving the city: capes and ranches, multiple LIRR stations, and real value compared to neighboring towns.",
  },
  {
    slug: "merrick",
    name: "Merrick",
    county: "Nassau",
    blurb:
      "South Shore living with larger colonials and splanches, sought-after schools, and quick access to the parkways and the water.",
  },
  {
    slug: "new-hyde-park",
    name: "New Hyde Park",
    county: "Nassau",
    blurb:
      "A commuter favorite straddling the Queens line — hi-ranches and capes, strong schools, and easy rail access into the city.",
  },
  {
    slug: "lindenhurst",
    name: "Lindenhurst",
    county: "Suffolk",
    blurb:
      "Suffolk's South Shore value play: a revitalized village downtown, waterfront pockets, and colonials that still trade below Nassau prices.",
  },
  {
    slug: "hewlett",
    name: "Hewlett",
    county: "Nassau",
    blurb:
      "Part of the Five Towns, with everything from garden co-ops to substantial single-family homes minutes from the beach clubs.",
  },
  {
    slug: "far-rockaway",
    name: "Far Rockaway",
    county: "Queens",
    blurb:
      "Beachside Queens with large multi-bedroom homes and two-families — strong demand and some of the best value near the ocean.",
  },
  {
    slug: "rockaway-beach",
    name: "Rockaway Beach",
    county: "Queens",
    blurb:
      "NYC's beach town. Bungalows and colonials a short walk from the boardwalk, with the A train and ferry into Manhattan.",
  },
  {
    slug: "ozone-park",
    name: "Ozone Park",
    county: "Queens",
    blurb:
      "Classic Queens blocks of Tudors and row homes with quick access to the A train, the airport, and Resorts World.",
  },
];
