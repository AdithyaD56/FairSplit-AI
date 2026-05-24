import { Link } from "react-router-dom";

import AssistantAvatarStrip from "../components/AssistantAvatarStrip";
import ExpenseAnalyzerPanel from "../components/ExpenseAnalyzerPanel";
import LiveActivityFeed from "../components/LiveActivityFeed";
import Navbar from "../components/Navbar";
import TravelAssistantWidget from "../components/TravelAssistantWidget";
import TypedTagline from "../components/TypedTagline";

export default function DashboardPage() {
  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2.2rem] border border-white/80 bg-white/82 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/84 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Bill splitter
            </p>
            <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
              Split messy group expenses without mixing in trip logic.
            </h1>
            <TypedTagline
              phrases={[
                "Drop the story in. Get the split out.",
                "Clear shares for dinners, trips, cabs, and mixed payers.",
                "Who owes whom, without the group-chat drama.",
              ]}
              className="mt-5 max-w-2xl min-h-[3.75rem] text-sm font-semibold leading-8 text-slate-600 dark:text-slate-300 sm:text-base"
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Main focus", "Shared bills and fair settlements"],
                ["Bot mode", "Splitter mode by default"],
                ["Travel tools", "Grouped into one travel workspace"],
              ].map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-[1.6rem] bg-gradient-to-br from-white to-brand-50 px-4 py-4 shadow-soft dark:from-slate-900/95 dark:to-brand-950/40"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">{value}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                to="/history"
                className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02]"
              >
                View Split History
              </Link>
              <Link
                to="/trip-planner"
                className="rounded-full border border-white/80 bg-white px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-slate-700 shadow-soft transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
              >
                Open Travel Workspace
              </Link>
            </div>
          </div>

          <section className="rounded-[2.2rem] border border-white/80 bg-gradient-to-br from-white via-brand-50/70 to-sky-50 p-6 shadow-soft dark:border-white/12 dark:from-slate-950/95 dark:via-brand-950/20 dark:to-slate-900 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              FairSplit flow
            </p>
            <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              Shared spend, clear settlements.
            </h2>
            <TypedTagline
              phrases={[
                "Messy bill in. Clean settlement out.",
                "Short answers your group can act on fast.",
                "Fair shares without spreadsheet energy.",
              ]}
              className="mt-4 max-w-2xl min-h-[3.5rem] text-sm font-semibold leading-8 text-slate-700 dark:text-slate-200"
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.8rem] border border-white/85 bg-white/92 p-5 shadow-soft dark:border-white/12 dark:bg-slate-900/95">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Handles
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                  Partial joins, half shares, cab-only splits, and mixed payers.
                </p>
              </article>
              <article className="rounded-[1.8rem] border border-white/85 bg-white/92 p-5 shadow-soft dark:border-white/12 dark:bg-slate-900/95">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Output
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                  A short summary, fair shares, and the minimum transfers needed.
                </p>
              </article>
            </div>
          </section>
        </section>

        <div className="mt-8">
          <AssistantAvatarStrip />
        </div>

        <div className="mt-8">
          <LiveActivityFeed />
        </div>

        <div className="mt-8">
          <ExpenseAnalyzerPanel />
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-white/80 bg-gradient-to-br from-white via-brand-50/70 to-sun-50/80 p-6 shadow-soft dark:border-white/12 dark:from-slate-950/95 dark:via-brand-950/30 dark:to-slate-900 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                Travel tools
              </p>
              <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
                Open trip planning only when you need it.
              </h2>
              <TypedTagline
                phrases={[
                  "Travel tools stay ready, not in the way.",
                  "Jump to planning when the group is ready to move.",
                  "Keep FairSplit focused until the trip needs its own space.",
                ]}
                className="mt-3 max-w-2xl min-h-[3.5rem] text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300"
              />
            </div>
            <Link
              to="/trip-planner"
              className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02]"
            >
              Open Travel Workspace
            </Link>
          </div>
        </section>
      </main>

      <TravelAssistantWidget page="dashboard" initialMode="splitter" />
    </div>
  );
}
