"use client";

/*
  THE SIGNATURE ELEMENT — the seller lead magnet.

  Instead of a boxed form, the ask is a giant serif sentence the visitor
  completes: "I'd like to know what my home at ____ in ____ is worth."
  It's conversational (on-brand for a no-pressure brokerage), memorable,
  and it IS the primary conversion goal of the whole site: seller leads.

  Mechanics worth understanding:
  - Controlled inputs: each field's value lives in React state, so validation
    and submission read from state, never from the DOM.
  - The hidden "company" field is a honeypot: humans never see it, spam bots
    auto-fill it, and the API quietly drops any submission where it's filled.
  - Submit POSTs JSON to our own API route (/api/lead) — see app/api/lead/route.ts.
  - Accessibility: the sentence is the visible label; each input also has a
    screen-reader-only <label> so it's announced properly.
*/

import { useState, type FormEvent } from "react";
import { areas } from "@/data/areas";
import { business } from "@/data/site";

export default function HomeValueForm() {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!address.trim() || !town) {
      setError("Tell us the address and town so we can pull real comps.");
      return;
    }
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Add your name and a phone number or email so we can send your number.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "home-value",
          address,
          town,
          name,
          phone,
          email,
          company: honeypot,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
    } catch {
      setStatus("idle");
      setError("Something went wrong sending that — call us instead and we'll do it live.");
    }
  }

  return (
    <section id="home-value" className="relative overflow-hidden bg-atlantic">
      {/* quiet brass keyline up top — the section announces itself with type, not decoration */}
      <div aria-hidden="true" className="h-1 bg-brass" />

      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass-light">
          Free home valuation — no listing required
        </p>

        {status === "sent" ? (
          <div className="mt-8" role="status">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Got it — we&rsquo;re pulling your comps.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              John or a senior agent will reach out with a real number for{" "}
              <span className="font-semibold text-brass-light">{address}</span>, usually the
              same day. Want it faster? Call{" "}
              <a href={business.phoneNassauHref} className="font-semibold text-brass-light underline underline-offset-4">
                {business.phoneNassau}
              </a>{" "}
              now.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="sr-only">What is my home worth?</h2>

            {/* The sentence */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-5 font-display text-2xl font-medium leading-snug text-white sm:text-3xl lg:text-[2.6rem]">
              <span>I&rsquo;d like to know what my home at</span>
              <span className="min-w-[14rem] grow basis-64">
                <label htmlFor="hv-address" className="sr-only">
                  Street address
                </label>
                <input
                  id="hv-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="123 Maple Street"
                  className="inline-input w-full"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </span>
              <span>in</span>
              <span>
                <label htmlFor="hv-town" className="sr-only">
                  Town
                </label>
                <select
                  id="hv-town"
                  className="inline-input min-w-[12rem]"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                >
                  <option value="" disabled>
                    choose a town
                  </option>
                  {areas.map((a) => (
                    <option key={a.slug} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                  <option value="Somewhere else on LI">somewhere else</option>
                </select>
              </span>
              <span>is worth.</span>
            </div>

            {/* Contact row */}
            <div className="mt-10 grid gap-3 sm:max-w-3xl sm:grid-cols-3">
              <div>
                <label htmlFor="hv-name" className="sr-only">
                  Your name
                </label>
                <input
                  id="hv-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-brass-light"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="hv-phone" className="sr-only">
                  Phone
                </label>
                <input
                  id="hv-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone"
                  className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-brass-light"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="hv-email" className="sr-only">
                  Email
                </label>
                <input
                  id="hv-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-brass-light"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Honeypot — invisible to humans, irresistible to bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="hv-company">Company</label>
              <input
                id="hv-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm font-medium text-brass-light">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-md bg-brass-light px-7 py-3.5 text-base font-semibold text-harbor transition-colors hover:bg-white disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send me my home's value"}
              </button>
              <p className="max-w-xs text-sm text-white/60">
                A real comp-based number from a real local agent. No spam, no pressure,
                no obligation to list.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
