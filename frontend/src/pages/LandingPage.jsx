import { Link, useNavigate } from "react-router-dom";

import LegalFooterBar from "../components/LegalFooterBar";
import ThemeToggle from "../components/ThemeToggle";
import TypedTagline from "../components/TypedTagline";
import { useAuth } from "../context/AuthContext";

const featureStats = [
  {
    label: "Bill Splitter",
    value: "Primary workspace for shared expenses",
  },
  {
    label: "Travel Workspace",
    value: "Planning, booking links, and destination guides together",
  },
  {
    label: "Trip Drafts",
    value: "Saved itineraries with budget ranges and per-person estimates",
  },
];

export default function LandingPage() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  function handlePrimaryAction() {
    if (authLoading) return;
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    navigate(user ? "/dashboard" : "/auth");
  }

  function handleTravelAction() {
    if (authLoading) return;
    navigate(user ? "/trip-planner" : "/auth");
  }

  return (
    <main className="animated-shell min-h-screen dark:text-slate-100">
      <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
          FairSplit <span className="text-brand-600">AI</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ThemeToggle compact />
          <Link
            to="/developers"
            className="rounded-full border border-white/85 bg-white/92 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
          >
            Developers
          </Link>
          <a
            href="/user-manual.md"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/85 bg-white/92 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
          >
            User Manual
          </a>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-5 py-2.5 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
          >
            {user ? "Open FairSplit" : "Start Splitting"}
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pt-16">
        <div>
          <p className="inline-flex rounded-full border border-white/85 bg-white/92 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-700 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
            Fair bills first, travel support second
          </p>
          <TypedTagline
            text="Split fair. Travel light. Stay friends."
            className="mt-6 min-h-[2rem] text-sm font-black uppercase tracking-[0.22em] text-brand-700 dark:text-slate-50"
          />
          <h1 className="gradient-title mt-8 max-w-4xl text-6xl font-black tracking-[-0.07em] sm:text-7xl">
            Shared expenses, sorted.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
            FairSplit AI stays focused on shared bills, fair shares, and short explanations.
            Travel planning, destination discovery, and booking shortcuts now live together
            in one travel workspace so the product feels cleaner and more professional.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-base font-bold text-white shadow-neon transition hover:scale-105"
            >
              Launch Bill Splitter
            </button>
            <button
              type="button"
              onClick={handleTravelAction}
              className="rounded-full border border-white/85 bg-white/92 px-8 py-4 text-center text-base font-bold text-slate-700 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-950/90 dark:text-slate-100"
            >
              Open Travel Workspace
            </button>
            <Link
              to="/developers"
              className="rounded-full border border-white/85 bg-white/92 px-8 py-4 text-center text-base font-bold text-slate-700 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-950/90 dark:text-slate-100"
            >
              Contact & Developers
            </Link>
            <a
              href="/user-manual.md"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/85 bg-white/92 px-8 py-4 text-center text-base font-bold text-slate-700 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-950/90 dark:text-slate-100"
            >
              User Manual
            </a>
          </div>
        </div>

        <section className="grid gap-4">
          {featureStats.map((item, index) => (
            <article
              key={item.label}
              className={`rounded-[2rem] border border-white/85 p-6 shadow-soft dark:border-white/12 ${
                index === 0
                  ? "bg-gradient-to-br from-white via-brand-50 to-sky-50 dark:from-slate-950/95 dark:via-brand-950/25 dark:to-slate-900"
                  : index === 1
                    ? "bg-gradient-to-br from-white via-sun-50 to-orange-50 dark:from-slate-950/95 dark:via-sun-950/15 dark:to-slate-900"
                    : "bg-gradient-to-br from-white via-coral-50 to-rose-50 dark:from-slate-950/95 dark:via-coral-950/15 dark:to-slate-900"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                {item.value}
              </p>
            </article>
          ))}
        </section>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <LegalFooterBar />
      </section>
    </main>
  );
}
