import type { Metadata } from "next";
import { agents } from "@/data/agents";
import { initials } from "@/data/site";


export const metadata: Metadata = {
  title: "Agents",
  description:
    "Agents with John Savoretti Realty.",
};

export default function AgentsPage() {

  return (
    <section id="agents" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
              Our agents
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-harbor sm:text-4xl">
              Meet our agents
            </h2>
          </div>
          <a
            href="/#contact"
            className="text-sm font-semibold text-atlantic underline-offset-4 hover:underline"
          >
            Work with one of our agents →
          </a>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-2xl border border-atlantic/10 bg-fog p-6 transition hover:border-atlantic/30"
            >
              {/* Initials avatar — replaced by real headshots when John sends them */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-atlantic font-display text-xl font-semibold text-brass-light">
                {initials(agent.name)}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-harbor">
                {agent.name}
              </h3>
              <p className="text-sm text-mist">
                {agent.title} · {agent.office}
              </p>
              <a
                href={agent.officePhone}
                className="mt-3 inline-block text-sm font-semibold text-atlantic hover:text-channel"
              >
                {agent.officePhone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
