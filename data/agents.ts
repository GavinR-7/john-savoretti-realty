export type Agent = {
    name : string;
    slug : string;
    title : string;
    office : string;
    officePhone : string;
    cell : string | null;
    image : string;
    featured : boolean;
};

export const agents: Agent[] = [
    {
        name : "John Savoretti",
        slug : "john-savoretti",
        title : "Broker/Owner",
        office : "Smithtown",
        officePhone : "516-327-6400 x310",
        cell : null,
        image : "",
        featured : true,
    },
    {
        name : "Dennis Arango",
        slug : "dennis-arango",
        title : "Associate Broker",
        office : "Franklin Square",
        officePhone : "516-327-6400",
        cell : null,
        image : "",
        featured : true,
    },
    {
        name : "Joe Romeo",
        slug : "joe-romeo",
        title : "Lic. Real Estate Associate Broker",
        office : "Franklin Square",
        officePhone : " 516-327-6400 Ext353",
        cell : "516-870-6007",
        image : "",
        featured : true,
    },
    {
        name : "Louis Tullo",
        slug: "louis-tullo",
        title : "Lic. Real Estate Salesperson",
        office : "Franklin Square",
        officePhone : "516-327-6400 x313",
        cell : "(516)721-7257",
        image : "",
        featured : false,
    },
    {
        name : "Yolanda Recio",
        slug : "yolanda-recio",
        title : "Lic. Real Estate Salesperson",
        office : "Franklin Square",
        officePhone : "516-327-6400 x331",
        cell : "(917)681-9690",
        image : "",
        featured : false,
    },
];

// Converts a human-readable phone string (optionally with an "x123" / "Ext.123"
// extension) into a tel: URI, e.g. "516-327-6400 x310" -> "tel:+15163276400,310".
// Returns null for missing or malformed numbers so callers can skip the link.
export function toTelHref(phone: string | null): string | null {
  if (!phone) return null;

  const [main, ext] = phone.split(/\s*(?:x|ext\.?)\s*/i);
  const digits = main.replace(/\D/g, "");
  if (digits.length !== 10) return null;

  const extDigits = ext?.replace(/\D/g, "");
  return `tel:+1${digits}${extDigits ? `,${extDigits}` : ""}`;
}

