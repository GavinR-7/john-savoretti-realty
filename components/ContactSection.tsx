"use client";

/*
  MAIN CONTACT FORM — same patterns as HomeValueForm (controlled inputs,
  honeypot, POST to /api/lead, sent-state swap), different lead type.

  The "intent" select is the important field for John: it tells his office
  whether this is a buyer, a seller, or a valuation request before anyone
  calls back. Spec requirement: inline form, NO popups.
*/

import { useState, type FormEvent } from "react";
import { business } from "@/data/site";

const INTENTS = ["Buying", "Selling", "Home valuation", "General question"];

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState(INTENTS[0]);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Add your name and a phone number or email so we can get back to you.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "contact",
          name,
          email,
          phone,
          intent,
          message,
          company: honeypot,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
    } catch {
      setStatus("idle");
      setError(
        `Something went wrong on our end — call us instead at ${business.phoneNassau}.`,
      );
    }
  }

  return (
    <section id="contact" className="bg-fog">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[2fr_3fr] md:py-28">
        {/* Left: heading + direct contact info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
            Contact
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-harbor sm:text-4xl">
            Tell us what you&rsquo;re planning.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist">
            Buying, selling, or just curious what your home is worth — there&rsquo;s
            no pressure and no obligation. Prefer to talk to a person? Call
            either office.
          </p>

          <dl className="mt-8 space-y-5">
            {business.offices.map((office) => (
              <div key={office.id}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-mist">
                  {office.name}
                </dt>
                <dd className="mt-1">
                  <a
                    href={office.phoneHref}
                    className="font-display text-xl font-semibold text-atlantic hover:text-channel"
                  >
                    {office.phone}
                  </a>
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-mist">
                Email
              </dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${business.email}`}
                  className="break-all text-sm font-semibold text-atlantic hover:text-channel"
                >
                  {business.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Right: the form card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {status === "sent" ? (
            <div className="flex h-full flex-col items-start justify-center gap-3 py-10">
              <p className="font-display text-2xl font-semibold text-harbor">
                Got it — thanks, {name.split(" ")[0]}.
              </p>
              <p className="text-mist">
                Someone from the office will reach out shortly. If it&rsquo;s
                urgent, call{" "}
                <a
                  href={business.phoneNassauHref}
                  className="font-semibold text-atlantic"
                >
                  {business.phoneNassau}
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="text-xs font-semibold uppercase tracking-wide text-mist"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-1 w-full rounded-lg border border-atlantic/15 bg-white px-3 py-2.5 text-ink outline-none transition focus:border-atlantic"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-intent"
                    className="text-xs font-semibold uppercase tracking-wide text-mist"
                  >
                    I&rsquo;m interested in
                  </label>
                  <select
                    id="contact-intent"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-atlantic/15 bg-white px-3 py-2.5 text-ink outline-none transition focus:border-atlantic"
                  >
                    {INTENTS.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="text-xs font-semibold uppercase tracking-wide text-mist"
                  >
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    className="mt-1 w-full rounded-lg border border-atlantic/15 bg-white px-3 py-2.5 text-ink outline-none transition focus:border-atlantic"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-xs font-semibold uppercase tracking-wide text-mist"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-1 w-full rounded-lg border border-atlantic/15 bg-white px-3 py-2.5 text-ink outline-none transition focus:border-atlantic"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="contact-message"
                  className="text-xs font-semibold uppercase tracking-wide text-mist"
                >
                  Message <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-atlantic/15 bg-white px-3 py-2.5 text-ink outline-none transition focus:border-atlantic"
                />
              </div>

              {/* Honeypot — invisible to humans, bait for spam bots */}
              <div aria-hidden="true" className="absolute left-[-9999px]">
                <label htmlFor="contact-company">Company</label>
                <input
                  id="contact-company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm font-medium text-brass-deep">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-6 w-full rounded-lg bg-atlantic px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-channel disabled:opacity-60 sm:w-auto"
              >
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
