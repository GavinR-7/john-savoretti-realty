/*
  AGENTS TEASER — server component, pure display.
  Three real agents from the current roster (data/site.ts). A full /agents
  page with all ~30 agents is a great v2 exercise: same pattern as
  app/areas/[slug], driven by a data array.
*/

import { business, initials } from "@/data/site";
import { agents, toTelHref } from "@/data/agents";

export default function AgentsTeaser() {
  const agentsStat = business.stats[2];
  const agentsLabel = agentsStat.animate
    ? `${agentsStat.prefix}${agentsStat.target}${agentsStat.suffix}`
    : agentsStat.value;

  return (
    <section id="agents" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-deep">
              Our agents
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-harbor sm:text-4xl">
              {agentsLabel} agents who know your block
            </h2>
          </div>
          <a
            href="/agents"
            className="text-sm font-semibold text-atlantic underline-offset-4 hover:underline"
          >
            See all agents →
          </a>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {agents.filter((a) => a.featured).map((agent) => {
            const officeHref = toTelHref(agent.officePhone);
            const cellHref = toTelHref(agent.cell);

            return (
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
                <p className="text-sm font-medium text-harbor">{agent.title}</p>
                <p className="text-sm text-mist">{agent.office}</p>
                {officeHref && (
                  <a
                    href={officeHref}
                    className="mt-3 inline-block text-sm font-semibold text-atlantic hover:text-channel"
                  >
                    {agent.officePhone}
                  </a>
                )}
                {cellHref && (
                  <a
                    href={cellHref}
                    className="mt-1 block text-sm text-mist hover:text-atlantic"
                  >
                    Cell: {agent.cell}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
