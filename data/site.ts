/*
  SINGLE SOURCE OF TRUTH for the business.
  Every component imports from here — change a phone number once, it updates
  in the header, hero, footer, mobile call bar, and structured data.

  Sources: client spec + johnsavoretti's current site (vlshomes.com/brokers/josv),
  pulled June 2026. Verify anything marked TODO with John before launch.
*/

export const business = {
  name: "John Savoretti Realty",
  legalLine: "Licensed Real Estate Broker — New York",
  tagline: "Family-run Long Island brokerage since 2001",

  // TODO: confirm with John — his current site publishes JohnSavoretti@optonline.net,
  // the spec says OfficeAdmin@JohnSavorettiRealty.com. Using the spec's for now.
  email: "JohnSavoretti@optonline.net",

  phoneNassau: "(516) 327-6400",
  phoneNassauHref: "tel:+15163276400",
  phoneSuffolk: "(631) 656-8600",
  phoneSuffolkHref: "tel:+16316568600",

  // TODO: office landlines usually can't receive SMS. Swap in a cell number
  // (John's or a Twilio number) before launch so "Text us" actually works.
  smsHref: "sms:+15163276400",

  instagram: "https://www.instagram.com/john_savoretti_realty/",
  facebook: "https://www.facebook.com/JohnSavorettiRealEstate",

  offices: [
    {
      id: "nassau",
      name: "Nassau office",
      address: "957 Hempstead Tpke",
      cityStateZip: "Franklin Square, NY 11010",
      phone: "(516) 327-6400",
      phoneHref: "tel:+15163276400",
      mapQuery: "957 Hempstead Tpke, Franklin Square, NY 11010",
    },
    {
      id: "suffolk",
      name: "Suffolk office",
      address: "59 West Main Street",
      cityStateZip: "Smithtown, NY 11787",
      phone: "(631) 656-8600",
      phoneHref: "tel:+16316568600",
      mapQuery: "59 West Main Street, Smithtown, NY 11787",
    },
  ],

  // Trust-strip stats (from the realtor.com profile + spec).
  stats: [
    { value: "$47M+", label: "Sold in the last 12 months" },
    { value: "58", label: "Homes sold last year" },
    { value: "30+", label: "Agents across two offices" },
    { value: "BBB A+", label: "Accredited brokerage" },
    { value: "5.0★", label: "Client rating" },
  ],

  /*
    NY-REQUIRED COMPLIANCE DOCS — currently hosted on the old site vendor's
    domain (vlshomes.com). ⚠️ If John leaves that vendor these links die.
    Before launch: download the PDFs, put them in /public/docs/, and point
    these paths at /docs/... instead. NY State requires brokers to post the
    Fair Housing Notice and Standardized Operating Procedures on their site.
  */
  compliance: {
    fairHousing: "https://www.vlshomes.com/brokers/Fair_Housing_notice_NYS.PDF",
    sop: "https://www.vlshomes.com/brokers/JOSV/sop.pdf",
    accommodations:
      "https://www.vlshomes.com/brokers/Reasonable-modification-and-accommodation-notice.PDF",
  },
};

// Real agents from the current roster — featured on the homepage teaser.
// The full ~30-agent roster becomes its own /agents page in v2.
export const featuredAgents = [
  {
    name: "Dennis Arango",
    title: "Associate Broker",
    office: "Franklin Square",
    phone: "(516) 327-6400",
    phoneHref: "tel:+15163276400",
  },
  {
    name: "Michael Cervone",
    title: "Associate Broker",
    office: "Franklin Square",
    phone: "(516) 327-6400",
    phoneHref: "tel:+15163276400",
  },
  {
    name: "Rosemarie Causarano",
    title: "Lic. RE Salesperson",
    office: "Smithtown",
    phone: "(631) 656-8600",
    phoneHref: "tel:+16316568600",
  },
];

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
