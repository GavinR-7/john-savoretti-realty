import { z } from "zod";
import { spam } from "@/content/spam";

export type SpamReason = "honeypot" | "too_fast" | "turnstile" | "zod";

// Each log is one increment. Sum count by reason in retained platform logs;
// process-local totals would reset on cold starts and double-count snapshots.
export function countRejection(reason: SpamReason) {
  console.info(JSON.stringify({ event: "contact_spam_rejected", reason, count: 1 }));
}

/** One event after the mail provider accepts delivery, never form/request data. */
export function logSubmission(site: "above-all-tents-v2" | "john-savoretti-realty" | "embedded-intent") {
  console.info(JSON.stringify({
    event: "contact_submitted",
    timestamp: new Date().toISOString(),
    site,
    outcome: "accepted",
  }));
}

const protectionSchema = z.object({
  companyUrl: z.string().max(5000).optional(),
  company: z.string().max(5000).optional(),
  renderedAt: z.coerce.number().finite().positive(),
  turnstileToken: z.string().max(2048).optional(),
});

function reject(reason: SpamReason, message: string, status = 400) {
  countRejection(reason);
  return Response.json({ ok: false, message, error: message }, { status });
}

/** Run before delivery. No development/production bypass and no personal logs. */
export async function checkFormSpam(body: unknown, request: Request): Promise<Response | null> {
  const parsed = protectionSchema.safeParse(body);
  if (!parsed.success) return reject("zod", spam.errors.invalid);
  const data = parsed.data;
  if (data.companyUrl?.trim() || data.company?.trim()) {
    return reject("honeypot", spam.errors.honeypot);
  }
  // This is a heuristic, not authentication: the browser timestamp can be forged.
  // Turnstile provides independent server-verified protection.
  const elapsed = Date.now() - data.renderedAt;
  if (elapsed < 3000) return reject("too_fast", spam.errors.tooFast);

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret || !siteKey) {
    return reject("turnstile", spam.errors.unconfigured, 503);
  }
  if (!data.turnstileToken) return reject("turnstile", spam.errors.verification);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: data.turnstileToken }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const result: unknown = await response.json();
    const verified = z.object({ success: z.literal(true), hostname: z.string(), action: z.literal("contact") }).safeParse(result);
    if (!response.ok || !verified.success || verified.data.hostname !== new URL(request.url).hostname) {
      return reject("turnstile", spam.errors.verification);
    }
    return null;
  } catch {
    return reject("turnstile", spam.errors.unavailable, 503);
  }
}
