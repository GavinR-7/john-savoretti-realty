/*
  FEATURED LISTINGS.
  Town, price, beds, baths, style, status, and MLS # are REAL — pulled from
  John's current exclusives on his live site (June 2026). Two things are
  placeholders, clearly marked:
    - image: Unsplash stock stand-ins. ⚠️ Do NOT copy photos off his old site —
      listing photos are usually licensed to the photographer/MLS. Get originals
      from John or wire an IDX feed.
    - description: written by us as sample copy; John should approve or replace.

  The shape of this array is the contract: when a live MLS/IDX feed gets wired
  in later, it just needs to produce objects that look like `Listing` and the
  whole UI keeps working. That's why everything renders from data, not
  hard-coded JSX.
*/

export type Listing = {
  // always present
  id: string;
  mls: string; // listing # from the current site — verify before publishing
  address?: string;
  city: string;
  state?: string;
  county?: string;
  image: string; // PLACEHOLDER — replace with real photos (see README)
  areaSlug: string;
  price: number;
  // might be missing
  taxes?: number;
  zip?: number;
  lotSize?: number;
  squareFeet?: number;
  yearBuilt?: number;
  numberOfFamilies?: number;
  rooms?: number;
  schoolDistrict?: string;
  gallery?: string[];
  agentSlug?: string;
  beds?: number;
  baths?: number;
  style?: string;
  status?: "For sale" |"For rent" | "Pending" | "Coming soon";
  dealType: "sale" | "rent" | "commercial";
  description?: string; // PLACEHOLDER COPY — have John approve
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const listings: Listing[] = [
  {
    id: "new-hyde-park-hi-ranch",
    mls: "3323307",
    address: "34, New Hyde Park",
    city: "New Hyde Park",
    state: "New York",
    areaSlug: "new-hyde-park",
    price: 1799999,
    taxes: 125,
    zip: 11797,
    lotSize: 300,
    squareFeet: 2000,
    yearBuilt: 2000,
    numberOfFamilies: 1,
    schoolDistrict: "New Hyde",
    agentSlug: "john-savoretti",
    beds: 4,
    baths: 3,
    style: "Hi-Ranch",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1570129477492-45c003edd2be"),
    description:
      "Oversized hi-ranch with room for the whole family — flexible lower level, updated kitchen, and a commuter's dream location.",
  },
  {
    id: "garden-city-tudor",
    mls: "7293787",
    address: "34, Garden City",
    city: "Garden City",
    state: "New York",
    areaSlug: "garden-city",
    price: 1250000,
    taxes: 230,
    zip: 11878,
    lotSize: 234,
    squareFeet: 2000,
    yearBuilt: 2000,
    numberOfFamilies: 1,
    schoolDistrict: "Garden city",
    agentSlug: "john-savoretti",
    beds: 4,
    baths: 3,
    style: "Tudor",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1576941089067-2de3c901e126"),
    description:
      "Storybook Tudor on a picture-perfect block — original character, modern systems, minutes to the village and the LIRR.",
  },
  {
    id: "merrick-colonial",
    mls: "7217655",
    address: "34, merrick",
    city: "Merrick",
    state: "New York",
    areaSlug: "merrick",
    price: 1588000,
    taxes: 230,
    zip: 11348,
    lotSize: 234,
    squareFeet: 2000,
    yearBuilt: 2000,
    numberOfFamilies: 1,
    schoolDistrict: "Merrick",
    agentSlug: "john-savoretti",
    beds: 5,
    baths: 5,
    style: "Colonial",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1598228723793-52759bba239c"),
    description:
      "Expansive five-bedroom colonial south of Merrick Road — sun-drenched layout, spa baths, and an entertainer's backyard.",
  },
  {
    id: "floral-park-colonial",
    mls: "7205875",
    city: "Floral Park",
    areaSlug: "floral-park",
    price: 1499000,
    beds: 4,
    baths: 4,
    style: "Colonial",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1600596542815-ffad4c1539a9"),
    description:
      "Fully reimagined colonial steps from the village — chef's kitchen, four full baths, and nothing left to do but move in.",
  },
  {
    id: "franklin-square-colonial",
    mls: "7295511",
    city: "Franklin Square",
    areaSlug: "franklin-square",
    price: 979000,
    beds: 4,
    baths: 3,
    style: "Colonial",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1568605114967-8130f3a36994"),
    description:
      "Wide-line colonial on one of Franklin Square's most established streets, around the corner from our flagship office.",
  },
  {
    id: "lindenhurst-colonial",
    mls: "7245304",
    city: "Lindenhurst",
    areaSlug: "lindenhurst",
    price: 839000,
    beds: 5,
    baths: 3,
    style: "Colonial",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1605146768851-eda79da39897"),
    description:
      "Five bedrooms in the heart of Suffolk's South Shore — space to spread out, close to the revitalized village downtown.",
  },
  {
    id: "valley-stream-cape",
    mls: "7291496",
    city: "Valley Stream",
    areaSlug: "valley-stream",
    price: 699000,
    beds: 3,
    baths: 1,
    style: "Cape Cod",
    status: "For sale",
    dealType: "sale",
    image: img("photo-1572120360610-d971b9d7767c"),
    description:
      "Classic cape with great bones and real upside — an honest starter home in a town buyers keep coming back to.",
  },
  {
    id: "franklin-square-cape",
    mls: "7267551",
    city: "Franklin Square",
    areaSlug: "franklin-square",
    price: 899000,
    beds: 3,
    baths: 2,
    style: "Cape Cod",
    status: "Pending",
    dealType: "sale",
    image: img("photo-1512917774080-9991f1c4c750"),
    description:
      "Expanded cape that went pending fast — proof of what the right prep and the right price do in this market.",
  },
  {
    id: "Baldwin",
    mls: "7287745",
    city: "Baldwin",
    areaSlug: "baldwin",
    price: 3750,
    style: "House",
    status: "For rent",
    dealType: "commercial",
    image: img("photo-1512917774080-9991f1c4c750"),
    description:
      "Updated office space for rent — reception and waiting area, 2 exam rooms plus an office, parking, and an elevator. Owner negotiable on customization time.",
  },
  {
    id: "Middle-Village-A-frame",
    mls: "7265985",
    city: "Middle Village",
    areaSlug: "middle-village",
    price: 3950,
    beds: 3,
    baths: 2,
    style: "A-frame",
    status: "For rent",
    dealType: "rent",
    image: img("photo-1512917774080-9991f1c4c750"),
    description:
      "First Floor Apartment. Totally Renovated",
  },
];

export const saleListings = listings.filter((l) => l.dealType == "sale");

export function formatPrice(price: number, dealType: string): string {
  const formatted = price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (dealType === "rent") {
    return formatted + "/mo";
  }
  return formatted;

}
