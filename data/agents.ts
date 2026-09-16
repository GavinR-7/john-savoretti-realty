export type Agent = {
    name : string;
    slug : string;
    title : string;
    office : string;
    officePhone : string;
    cell? : string;
    image : string;
    featured : boolean;
    description?: string;
    // The agent's ID in the MLS feed (RESO ListAgentMlsId). Lets a DB-backed
    // listing link back to this bio page. Fill in from John's live feed —
    // blank means "no link", which is safe: attribution still displays.
    mlsId?: string;
};

export const agents: Agent[] = [
    {
        name : "John Savoretti",
        slug : "john-savoretti",
        title : "Broker/Owner",
        office : "Smithtown",
        officePhone : "516-327-6400 x310",
        mlsId : "",          // ⚠️ TO FILL IN from John's live feed
        image : "",
        featured : true,
    },
    {
        name : "Dennis Arango",
        slug : "dennis-arango",
        title : "Associate Broker",
        office : "Franklin Square",
        officePhone : "516-327-6400",
        mlsId : "",          // ⚠️ TO FILL IN from John's live feed
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
        mlsId : "",          // ⚠️ TO FILL IN from John's live feed
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
        mlsId : "",          // ⚠️ TO FILL IN from John's live feed
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
        mlsId : "",          // ⚠️ TO FILL IN from John's live feed
        image : "",
        featured : false,
    },
];

/*
  MLS ID → agent bio page.

  IDX attribution (listing agent + office) always renders from the feed itself.
  This lookup is purely the extra step of recognising one of OUR agents so we
  can link their name to their bio. Returns undefined for every other
  brokerage's agents — which is the common case.

  ⚠️ TO FILL IN: set each `mlsId` above to that agent's real ListAgentMlsId
  once John's feed is live. Until then this always returns undefined and
  listings simply show plain-text attribution with no link.
*/
export function findAgentByMlsId(mlsId: string | undefined): Agent | undefined {
    if (!mlsId) return undefined;
    return agents.find((a) => a.mlsId && a.mlsId === mlsId);
}

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

