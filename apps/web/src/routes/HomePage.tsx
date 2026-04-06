import {
  DEFAULT_INITIAL_LIFE_TOTAL,
  DEFAULT_MAX_PLAYERS,
  MAX_MATCH_PLAYERS
} from "@mtg/shared";
import { FeatureCard } from "@/components/FeatureCard";
import { authModuleSummary } from "@/auth/auth-session";
import { matchesModuleSummary } from "@/matches/match-summary";
import { realtimeModuleSummary } from "@/realtime/realtime-client";
import { appMeta } from "@/shared/app-meta";

const productSignals = [
  {
    eyebrow: "Auth",
    title: "Identity-first foundation",
    description: authModuleSummary
  },
  {
    eyebrow: "Matches",
    title: "Game state with clear defaults",
    description: `${matchesModuleSummary} Default life total is ${DEFAULT_INITIAL_LIFE_TOTAL}, default seats are ${DEFAULT_MAX_PLAYERS}, and the upper limit is ${MAX_MATCH_PLAYERS}.`
  },
  {
    eyebrow: "Realtime",
    title: "Prepared for live synchronization",
    description: realtimeModuleSummary
  }
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[32px] border border-amber-950/10 bg-paper/85 p-8 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-ember/80">
            {appMeta.stageLabel}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-ink sm:text-6xl">
            A calm control room for every Magic life total on the table.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
            This first frontend slice sets up routing, shared contracts,
            styling, and a layout shell ready for authentication, match
            creation, and real-time updates.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {appMeta.foundationPillars.map((pillar) => (
              <span
                key={pillar}
                className="rounded-full border border-amber-950/10 bg-canvas px-4 py-2 text-sm text-stone-700"
              >
                {pillar}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-[32px] border border-moss/20 bg-moss p-8 text-paper shadow-card">
          <p className="text-xs uppercase tracking-[0.28em] text-gold/90">
            Immediate outcome
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-4xl font-display">apps/web</p>
              <p className="mt-2 text-sm leading-6 text-paper/80">
                Vite + React + TypeScript + Tailwind with BrowserRouter and
                workspace integration to shared contracts.
              </p>
            </div>
            <div className="rounded-3xl border border-paper/10 bg-black/10 p-5">
              <p className="text-sm font-medium">Prepared directories</p>
              <p className="mt-2 text-sm leading-6 text-paper/80">
                auth, matches, realtime, shared, services, routes, layouts and
                components.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {productSignals.map((signal) => (
          <FeatureCard key={signal.title} {...signal} />
        ))}
      </section>
    </div>
  );
}
