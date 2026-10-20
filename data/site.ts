/*
  SINGLE SOURCE OF TRUTH for the business.
  Every component imports from here — change a phone number once, it updates
  in the header, hero, footer, mobile call bar, and structured data.

  Sources: client spec + johnsavoretti's current site (vlshomes.com/brokers/josv),
  pulled June 2026. Verify anything marked TODO with John before launch.
*/

/*
  LAUNCH FLAGS — content that must not go live until the client backs it up.
  Both default to false (hidden). Flip one to true only once its TODO is met.

  showUnverifiedStats: the $47M sold, 58 homes, 30+ agents, BBB A+ and 5.0★
    figures. None has a source on record (see the launch checklist). Off, the
    trust strip under the hero is gone and every sentence that quotes one of
    these figures falls back to wording without it (Hero, About, Agents).
    Turn on per figure is not supported on purpose: when John sends sources,
    correct `stats` below to match them, then turn this on.
  showSampleTestimonials: the three "Sample review" quotes in
    data/testimonials.ts. Off, sample entries are filtered out; with no real
    reviews left the whole section is skipped. Real reviews (isSample: false)
    show regardless of this flag.
*/
export const launchFlags = {
  showUnverifiedStats: false,
  showSampleTestimonials: false,
};

type Stat =
  | { animate: true; target: number; prefix: string; suffix: string; label: string }
  | { animate: false; value: string; label: string };

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

  // Trust-strip stats (from the realtor.com profile + spec). UNVERIFIED:
  // shown only when launchFlags.showUnverifiedStats is true.
  stats: [
    { target: 47, prefix: "$", suffix: "M+", label: "Sold in the last 12 months", animate: true },
    { target: 58, prefix: "",  suffix: "",   label: "Homes sold last year",       animate: true },
    { target: 30, prefix: "",  suffix: "+",  label: "Agents across two offices",  animate: true },
    { value: "BBB A+",                       label: "Accredited brokerage",       animate: false },
    { value: "5.0★",                         label: "Client rating",              animate: false },
  ] as Stat[],
  /*
    NY-REQUIRED COMPLIANCE DOCS — now self-hosted in /public/docs, so they no
    longer break if John leaves the old vendor (vlshomes.com). NY State
    requires brokers to post the Fair Housing Notice and Standardized
    Operating Procedures. ⚠️ Have John confirm the SOP is the current version
    with his name and license on it before launch.
  */
  compliance: {
    // Served from /public/docs — downloaded from the old vendor so these
    // survive John leaving vlshomes.com. NY requires them to stay reachable.
    fairHousing: "/docs/fair-housing-notice.pdf",
    sop: "/docs/standardized-operating-procedures.pdf",
    accommodations: "/docs/reasonable-accommodations.pdf",
  },
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
