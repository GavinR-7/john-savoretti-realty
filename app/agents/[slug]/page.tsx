/*
  DYNAMIC AGENT PAGES — app/agents/[slug]/page.tsx
  One file → one page per agent (/agents/dennis-arango, etc.).

  Note the two-directional relational lookup at work here: the listing page
  takes one listing and finds its one agent (.find). This page takes one
  agent and finds their many listings (.filter). Same `agentSlug` key,
  traversed both ways.
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { agents, toTelHref } from "@/data/agents";
import { listings } from "@/data/listings";
import { business, initials } from "@/data/site";
import ListingCard from "@/components/ListingCard";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) return {};

  return {
    title: `${agent.name} — ${agent.title}`,
    description: `${agent.name}, ${agent.title} at John Savoretti Realty's ${agent.office} office. Buying or selling on Long Island? Get in touch.`,
  };
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) notFound();

  const agentListings = listings.filter((l) => l.agentSlug === slug);

  const officeHref = toTelHref(agent.officePhone);
  const cellHref = agent.cell ? toTelHref(agent.cell) : null;

  // Every agent works out of one of the two offices — resolve which phone
  // number the "call the office" fallback should use.
  const officeNumber =
    agent.office === "Smithtown" ? business.phoneSuffolkHref : business.phoneNassauHref;

  return (
    <>
      {/* Breadcrumb — orientation + a way back to the roster */}
      <div className="border-b border-atlantic/10 bg-fog">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 text-sm sm:px-6">
          <Link href="/agents" className="font-medium text-atlantic hover:text-channel">
            Our agents
          </Link>
          <span className="text-mist">/</span>
          <span className="text-mist">{agent.name}</span>
        </div>
      </div>

      {/* Header band */}
      <section className="bg-atlantic text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* Initials avatar — swap for a real headshot once John sends photos:
                <Image src={agent.image} alt={agent.name} fill className="object-cover" /> */}
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-4xl font-semibold text-brass-light">
              {initials(agent.name)}
            </div>

            <div>
              <h1 className="font-display text-4xl font-semibold sm:text-5xl">{agent.name}</h1>
              <p className="mt-2 text-lg text-brass-light">{agent.title}</p>
              <p className="mt-1 text-white/70">{agent.office} office</p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {officeHref && (
                  <a href={officeHref} className="font-semibold text-brass-light hover:text-white">
                    Office: {agent.officePhone}
                  </a>
                )}
                {cellHref && (
                  <a href={cellHref} className="font-semibold text-brass-light hover:text-white">
                    Cell: {agent.cell}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio + CTA. The bio only renders once John supplies one — until then
          the section still stands on its own with the contact prompt. */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          {agent.description ? (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
                About {agent.name.split(" ")[0]}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-mist">{agent.description}</p>
            </>
          ) : (
            <p className="text-lg leading-relaxed text-mist">
              {agent.name} works with buyers and sellers across Long Island and
              Queens out of our {agent.office} office. Reach out directly or
              send a message and we&rsquo;ll connect you.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={officeHref ?? officeNumber}
              className="inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
            >
              Call {agent.name.split(" ")[0]}
            </a>
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center rounded-lg border border-atlantic/20 px-5 py-3 text-sm font-semibold text-atlantic transition hover:border-atlantic/50"
            >
              Send a message
            </Link>
          </div>
        </div>
      </section>

      {/* Their listings — or a graceful empty state. Most agents will have
          none until the IDX feed lands, so this branch matters. */}
      <section className="bg-fog">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          {agentListings.length > 0 ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-harbor">
                  {agent.name.split(" ")[0]}&rsquo;s listings
                </h2>
                <Link
                  href="/#listings"
                  className="text-sm font-semibold text-atlantic hover:text-channel"
                >
                  See all listings →
                </Link>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {agentListings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-atlantic/10 bg-white p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-semibold text-harbor">
                No active listings right now
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-mist">
                {agent.name} can show you any home on the market, not just our
                exclusives — and knows what&rsquo;s coming before it lists.
              </p>
              <a
                href={officeHref ?? officeNumber}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-atlantic px-5 py-3 text-sm font-semibold text-white transition hover:bg-channel"
              >
                Call {agent.name.split(" ")[0]}
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}