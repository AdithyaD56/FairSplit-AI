import { Link } from "react-router-dom";

import LegalFooterBar from "../components/LegalFooterBar";
import ThemeToggle from "../components/ThemeToggle";

const sections = [
  {
    title: "Information We Collect",
    points: [
      "Account information you provide when registering or signing in, including your name, email address, and authentication method.",
      "Content you voluntarily submit through the platform, including expense scenarios, trip drafts, support inquiries, and review messages.",
      "Operational and security-related records such as timestamps, basic activity logs, and platform events required to run and protect the service.",
    ],
  },
  {
    title: "How We Use Information",
    points: [
      "To authenticate accounts, maintain sessions, and provide user-specific access to dashboards, reviews, and trip drafts.",
      "To generate expense settlements, travel planning outputs, and other product responses requested inside the platform.",
      "To monitor service reliability, support product operations, and enable limited administrative oversight where required.",
    ],
  },
  {
    title: "Access and Visibility",
    points: [
      "Personal trip drafts and review history are intended to remain scoped to the account that created them.",
      "Administrative review tools and operational analytics are available only to authorized admin access.",
      "Private account information is not intended to be displayed publicly through the site’s public-facing pages.",
    ],
  },
  {
    title: "User Responsibilities and Choices",
    points: [
      "You may stop using the service at any time and may contact the site owner for reasonable account or privacy-related support.",
      "You should avoid submitting highly sensitive legal, financial, identity, or confidential information into free-text inputs unless explicitly required.",
      "Before broad public deployment, this policy should be reviewed again to reflect the final hosting, analytics, authentication, and support setup used by the site.",
    ],
  },
];

export default function PrivacyPage() {
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
            Privacy Policy
          </p>
          <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-700 dark:text-slate-200">
            This Privacy Policy explains how FairSplit AI collects, uses, stores, and limits
            access to information provided through the platform. It is written to give users a
            clear view of how account data, submitted content, and service activity are handled.
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
              Privacy Contact
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              Questions regarding privacy, account handling, or platform data practices may be
              directed through the public Developers page and the currently active inquiry contact
              details shown there.
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
