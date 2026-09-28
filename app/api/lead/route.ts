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
const HIDDEN_FIELDS = new Set(["company"]);

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
  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }

  // Honeypot: real visitors never see the "company" field. If it's filled,
  // a bot did it — pretend success so the bot moves on, but send nothing.
  if (data.company) {
    return NextResponse.json({ ok: true });
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
      JSON.stringify(data),
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
      console.error("Resend rejected lead:", error, JSON.stringify(data));
      return NextResponse.json(
        { ok: false, message: "We couldn't send that just now — please call the office." },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("Lead send threw:", err, JSON.stringify(data));
    return NextResponse.json(
      { ok: false, message: "We couldn't send that just now — please call the office." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
