import { Link } from "react-router-dom";

import LegalFooterBar from "../components/LegalFooterBar";
import ThemeToggle from "../components/ThemeToggle";

const sections = [
  {
    title: "Release Status",
    points: [
      "FairSplit AI V1.0 is the initial public version of the product.",
      "This release is focused on split-first budgeting, shared-expense clarity, and optional trip-draft planning.",
      "Forgot-password support is planned for a later update and is not part of the V1.0 user flow.",
    ],
  },
  {
    title: "What FairSplit AI Is For",
    points: [
      "FairSplit AI helps groups understand who paid, who participated, how much each person owes, and what the cleanest settlement plan looks like.",
      "Expense splitting is the primary workflow across the product.",
      "Trip planning is included as a supporting feature, not the main product objective.",
    ],
  },
  {
    title: "Main Features In V1.0",
    points: [
      "Account signup and login",
      "Natural-language expense splitting",
      "Saved split history",
      "Trip draft generation and storage",
      "Reviews and ratings",
      "Live activity updates in supported views",
      "Admin dashboard access for seeded admin accounts",
    ],
  },
  {
    title: "Typical User Flow",
    points: [
      "Sign up or log in.",
      "Enter an expense scenario in plain language.",
      "Review the calculated shares and reimbursements.",
      "Save and revisit split history when needed.",
      "Optionally generate a trip draft for budget planning.",
    ],
  },
];

export default function UserManualPage() {
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
            User Manual
          </p>
          <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
            FairSplit AI User Manual
          </h1>
          <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-700 dark:text-slate-200">
            This page explains what FairSplit AI is built for, what is included in the V1.0 release,
            and how users are expected to move through the app’s split-first experience.
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
              Product Position
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              FairSplit AI is intentionally split-first. Travel planning remains available as a
              lightweight support workflow, but the main product objective is simple, transparent,
              and fair shared-expense management.
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
