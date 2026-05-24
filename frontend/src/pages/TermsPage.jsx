import { Link } from "react-router-dom";

import LegalFooterBar from "../components/LegalFooterBar";
import ThemeToggle from "../components/ThemeToggle";

const sections = [
  {
    title: "Use of the Service",
    points: [
      "FairSplit AI is provided as a shared-expense and travel-support platform for informational, planning, and coordination purposes.",
      "You are responsible for reviewing generated outputs before relying on them for real-world payments, bookings, commitments, or decisions.",
      "You agree to use the platform lawfully and not to submit abusive, deceptive, malicious, or unauthorized content.",
    ],
  },
  {
    title: "Accounts and Access",
    points: [
      "You are responsible for keeping your login credentials secure and for activity that occurs under your account.",
      "Administrative access is restricted and must not be shared or exposed outside authorized use.",
      "Access may be suspended, restricted, or removed if misuse, abuse, fraud, or security risk is identified.",
    ],
  },
  {
    title: "Generated Results and Third-Party Data",
    points: [
      "Generated budgets, settlements, routes, and suggestions are informational tools and not legal, tax, financial, or booking guarantees.",
      "Live travel, location, weather, and currency insights may depend on third-party services and may change without notice.",
      "You should independently verify final prices, provider availability, payment obligations, and booking details before taking action.",
    ],
  },
  {
    title: "Service Availability and Changes",
    points: [
      "Features, integrations, models, and interface elements may be updated, improved, paused, or removed over time.",
      "Certain parts of the platform may remain experimental, in-progress, or subject to operational limits depending on deployment stage.",
      "These terms should be reviewed and refreshed again before broad commercial launch or formal public distribution.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="animated-shell min-h-screen dark:text-slate-100">
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
          FairSplit <span className="text-brand-600">AI</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ThemeToggle compact />
          <Link
            to="/"
            className="rounded-full border border-white/85 bg-white/92 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
          >
            Back to Homescreen
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="legal-page-shell rounded-[2.2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Terms & Conditions
          </p>
          <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
            Terms & Conditions
          </h1>
          <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-700 dark:text-slate-200">
            These Terms & Conditions govern access to and use of FairSplit AI. By using the
            site, you agree to use the service responsibly, review generated outputs before
            acting on them, and respect the operational and security boundaries of the platform.
          </p>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <section
                key={section.title}
                className="legal-section-card rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-slate-900/92"
              >
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {section.points.map((point) => (
                    <p key={point} className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                      {point}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="legal-note-card mt-8 rounded-[1.7rem] border border-white/80 bg-gradient-to-r from-brand-50 via-white to-sun-50 p-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Important Notice
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              FairSplit AI should not be treated as legal, tax, accounting, financial, or
              travel-booking advice. Final decisions should always be confirmed with the relevant
              people, providers, or service platforms.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <LegalFooterBar />
        </div>
      </section>
    </main>
  );
}
