/*
  LEAD API ROUTE — app/api/lead/route.ts maps to POST /api/lead.
  Both forms (home-value + contact) submit here.

  The route exists so the Resend API key stays server-side: anything in
  browser code is public, and env vars are only safe here.

  ⚠️ A failed send returns 500 on purpose. Previously this logged to the
  console and always returned ok, so in production every lead vanished while
  the visitor saw a success message — the worst possible failure for a lead
  form. Now the form shows its error state and the visitor knows to call.
*/

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { checkFormSpam, countRejection, logSubmission } from "@/lib/formSpam";

/*
  Sender defaults to Resend's shared onboarding address, which works without
  a verified domain but can ONLY deliver to the Resend account owner's own
  address. Once johnsavorettirealty.com is verified in Resend, set
  LEAD_FROM_EMAIL to something like "Website Leads <leads@johnsavorettirealty.com>"
  and mail will reach John's office inbox instead.
*/
const FROM = process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev";
const TO = process.env.LEAD_TO_EMAIL;

// Never echo the honeypot back into the email.
const HIDDEN_FIELDS = new Set(["company", "companyUrl", "renderedAt", "turnstileToken"]);

const leadSchema = z.object({
  formType: z.enum(["contact", "home-value"]),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).default(""),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).default(""),
  address: z.string().trim().max(300).optional(),
  town: z.string().trim().max(120).optional(),
  intent: z.string().trim().max(120).optional(),
  message: z.string().trim().max(5000).optional(),
}).refine((data) => Boolean(data.phone || data.email))
  .refine((data) => data.formType !== "home-value" || Boolean(data.address && data.town));

/*
  ABUSE LIMITS. This endpoint is public and every accepted request spends a
  Resend send, so a script could burn the quota or flood the inbox.
  - Size caps: at most MAX_FIELDS string fields, each at most MAX_FIELD_LENGTH.
    Our two forms send about ten short fields.
  - Per-IP limit: MAX_PER_WINDOW sends per WINDOW_MS. This lives in the
    function's memory, so it is best effort: each warm instance keeps its own
    count and a cold start resets it. A durable limit needs shared storage
    (Upstash Redis) or a Vercel Firewall rate-limit rule, both set up on the
    account before launch.
*/
const MAX_FIELDS = 20;
const MAX_FIELD_LENGTH = 5000;
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const recentByIp = new Map<string, number[]>();

function overLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (recentByIp.size > 5000) recentByIp.clear();
  return false;
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isSaneShape(data: unknown): data is Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const entries = Object.entries(data);
  return (
    entries.length <= MAX_FIELDS &&
    entries.every(([, v]) => typeof v === "string" && v.length <= MAX_FIELD_LENGTH)
  );
}

function subjectFor(data: Record<string, string>): string {
  if (data.formType === "home-value") {
    const where = [data.address, data.town].filter(Boolean).join(", ");
    return `🏠 Home value request${where ? ` — ${where}` : ""}`;
  }
  return `📨 Website inquiry — ${data.intent || "General"}`;
}

function bodyFor(data: Record<string, string>): string {
  const lines = Object.entries(data)
    .filter(([key, value]) => !HIDDEN_FIELDS.has(key) && String(value ?? "").trim() !== "")
    .map(([key, value]) => `${key}: ${value}`);
  return [
    ...lines,
    "",
    `Received: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} (ET)`,
  ].join("\n");
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    countRejection("zod");
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
  if (!isSaneShape(parsed)) {
    countRejection("zod");
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
  const blocked = await checkFormSpam(parsed, request);
  if (blocked) return blocked;
  const validated = leadSchema.safeParse(parsed);
  if (!validated.success) {
    countRejection("zod");
    return NextResponse.json({ ok: false, message: "Check your contact details and try again." }, { status: 400 });
  }
  const data = Object.fromEntries(Object.entries(validated.data).filter((entry): entry is [string, string] => typeof entry[1] === "string"));

  // After the honeypot (bots shouldn't learn they're limited) and before any
  // send. The form shows its error state, which tells a person to call.
  if (overLimit(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests — please call the office." },
      { status: 429 },
    );
  }

  const name = (data.name ?? "").trim();
  const phone = (data.phone ?? "").trim();
  const email = (data.email ?? "").trim();

  if (!name || (!phone && !email)) {
    return NextResponse.json(
      { ok: false, message: "Name and a phone or email are required." },
      { status: 400 },
    );
  }

  // Misconfiguration is a server fault, not the visitor's — fail loudly in
  // the logs and let the form show its error rather than swallowing a lead.
  if (!process.env.RESEND_API_KEY || !TO) {
    console.error(
      "Lead dropped: missing " +
        [!process.env.RESEND_API_KEY && "RESEND_API_KEY", !TO && "LEAD_TO_EMAIL"]
          .filter(Boolean)
          .join(" and "),
    );
    return NextResponse.json(
      { ok: false, message: "We couldn't send that just now — please call the office." },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email || undefined, // replying in the inbox goes straight to the lead
      subject: subjectFor(data),
      text: bodyFor(data),
    });

    // The SDK reports delivery failures in `error` rather than throwing.
    if (error) {
      console.error("Resend rejected lead");
      return NextResponse.json(
        { ok: false, message: "We couldn't send that just now — please call the office." },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("Lead send threw");
    return NextResponse.json(
      { ok: false, message: "We couldn't send that just now — please call the office." },
      { status: 500 },
    );
  }

  logSubmission("john-savoretti-realty");
  return NextResponse.json({ ok: true });
}
