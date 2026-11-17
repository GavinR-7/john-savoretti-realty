// Public indexing is enabled explicitly after the production launch checks.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://johnsavorettirealty.com"
).replace(/\/$/, "");

export const IS_PUBLIC_LAUNCH =
  process.env.NEXT_PUBLIC_SITE_MODE === "live" && process.env.VERCEL_ENV !== "preview";
