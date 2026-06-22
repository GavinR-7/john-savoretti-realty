/*
  TESTIMONIALS — ALL THREE ARE SAMPLES.
  Each card shows a visible "Sample review" badge on the site so nobody
  mistakes them for real reviews during the demo. Before launch, replace
  every entry with REAL quotes from John's Google / Zillow reviews (copy
  them exactly, get his OK, and set `isSample: false` to hide the badge).
*/

export type Testimonial = {
  quote: string;
  name: string;
  town: string;
  isSample: boolean;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "John told us exactly what our house would sell for and exactly why. No pressure, no games — we were in contract in two weeks, over asking.",
    name: "The R. family",
    town: "Franklin Square",
    isSample: true,
  },
  {
    quote:
      "As first-time buyers we had a thousand questions. Our agent answered every single one, talked us out of two bad houses, and into the right one.",
    name: "M. & D.",
    town: "Valley Stream",
    isSample: true,
  },
  {
    quote:
      "We interviewed three brokerages. Savoretti was the only one that felt like they'd still pick up the phone after the closing. They do.",
    name: "The C. family",
    town: "Smithtown",
    isSample: true,
  },
];
