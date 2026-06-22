/*
  LEAD API ROUTE — app/api/lead/route.ts maps to POST /api/lead.
  Both forms (home-value + contact) submit here.

  Right now it validates, drops spam, and logs the lead to the server
  console — enough for local dev and the demo. Before launch, wire it to
  email John via Resend (3 steps, ~10 minutes):

  1. npm install resend
  2. Get an API key at resend.com → put it in .env.local as RESEND_API_KEY
     (never commit .env.local — it's already in .gitignore)
  3. Uncomment the Resend block below and set John's real inbox.

  Why an API route at all (instead of posting from the browser to Resend)?
  Because the API key must stay SECRET. Anything in browser code is public.
  The route runs on the server, where env vars are safe.
*/

import { NextResponse } from "next/server";

// import { Resend } from "resend";
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }

  // Honeypot: real visitors never see the "company" field. If it's filled,
  // a bot did it — pretend success so the bot moves on, but save nothing.
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

  // For now: log it. Run `npm run dev` and watch the terminal when you
  // submit a form — this is your "inbox" during development.
  console.log("📥 New lead:", JSON.stringify(data, null, 2));

  /*
  await resend.emails.send({
    from: "Website Leads <leads@johnsavorettirealty.com>", // must be a domain you verify in Resend
    to: "OfficeAdmin@JohnSavorettiRealty.com",             // confirm with John
    subject:
      data.formType === "home-value"
        ? `🏠 Home value request — ${data.address ?? ""}, ${data.town ?? ""}`
        : `📨 Website inquiry — ${data.intent ?? "General"}`,
    text: Object.entries(data)
      .filter(([key]) => key !== "company")
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  });
  */

  return NextResponse.json({ ok: true });
}
