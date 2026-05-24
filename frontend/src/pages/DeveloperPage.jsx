import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import TypedTagline from "../components/TypedTagline";
import { useAuth } from "../context/AuthContext";
import { api, developerApi, getApiError } from "../services/api";

function GlobeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.6 4.2 5.6 4.2 9s-1.4 6.4-4.2 9c-2.8-2.6-4.2-5.6-4.2-9s1.4-6.4 4.2-9Z" />
    </svg>
  );
}

function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.61.07-.61 1 .07 1.52 1.02 1.52 1.02.88 1.52 2.3 1.08 2.86.82.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.02-2.68-.1-.25-.44-1.27.1-2.64 0 0 .83-.27 2.73 1.02a9.38 9.38 0 0 1 4.96 0c1.9-1.3 2.73-1.02 2.73-1.02.54 1.37.2 2.39.1 2.64.64.7 1.02 1.59 1.02 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.93.68 1.88l-.01 2.79c0 .27.18.59.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56A1.97 1.97 0 1 0 3.2 4.94a1.97 1.97 0 0 0 3.96 0ZM20 13.03c0-3.47-1.85-5.08-4.33-5.08-1.99 0-2.88 1.1-3.38 1.87V8.5H8.9c.04.88 0 11.5 0 11.5h3.39v-6.42c0-.34.03-.68.13-.93.27-.68.87-1.39 1.89-1.39 1.33 0 1.87 1.02 1.87 2.5V20H20v-6.97Z" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4.4 17.8V7.3l7.6 5.7V18H7.2c-1.5 0-2.8-.2-2.8-.2Z"
        fill="#34A853"
      />
      <path
        d="M19.6 17.8V7.3L12 13v5h4.8c1.5 0 2.8-.2 2.8-.2Z"
        fill="#4285F4"
      />
      <path
        d="M4.4 7.3 8.8 10.6 12 13l3.2-2.4 4.4-3.3-.8-1.1a2.2 2.2 0 0 0-1.8-.9H7a2.2 2.2 0 0 0-1.8.9l-.8 1.1Z"
        fill="#EA4335"
      />
      <path
        d="M8.8 10.6V18h6.4v-7.4L12 13l-3.2-2.4Z"
        fill="#FBBC05"
      />
    </svg>
  );
}

export default function DeveloperPage() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const avatarSrc = profile?.avatar_url?.startsWith("/")
    ? `${api.defaults.baseURL}${profile.avatar_url}`
    : profile?.avatar_url;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await developerApi.getProfile();
        setProfile(data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handlePrimaryAction() {
    if (authLoading) return;
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    navigate(user ? "/dashboard" : "/auth");
  }

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    navigate(user ? "/dashboard" : "/");
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
            to="/"
            className="rounded-full border border-white/85 bg-white/92 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
          >
            Back to Homescreen
          </Link>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-5 py-2.5 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
          >
            {user ? "Open FairSplit" : "Get Started"}
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {user ? (
          <button
            type="button"
            onClick={handleGoBack}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <span aria-hidden="true">&lt;</span>
            <span>Back</span>
          </button>
        ) : null}
        <div className="rounded-[2.2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Developers
          </p>
          <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
            Built by real people, kept intentionally simple.
          </h1>
          <TypedTagline
            phrases={[
              "A cleaner way to split, plan, and move together.",
              "Less clutter, more clarity.",
              "Small details, sharper product feel.",
            ]}
            className="mt-5 min-h-[3.4rem] max-w-2xl text-sm font-semibold leading-8 text-slate-600 dark:text-slate-300"
          />

          {loading ? (
            <div className="mt-8 rounded-[1.8rem] border border-white/70 bg-white/80 p-6 text-sm text-slate-600 dark:border-white/12 dark:bg-slate-900/92 dark:text-slate-300">
              Loading developer details...
            </div>
          ) : error ? (
            <div className="mt-8 rounded-[1.8rem] bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
              {error}
            </div>
          ) : (
            <section className="mt-8 grid gap-6 md:grid-cols-[15rem_1fr]">
              <div className="rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-brand-50/70 to-sky-50/70 p-5 shadow-soft dark:border-white/12 dark:from-slate-900/95 dark:via-brand-950/20 dark:to-slate-900">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/80 shadow-soft dark:border-white/12 dark:bg-slate-950/90">
                  <img
                    src={avatarSrc}
                    alt={profile?.display_name || "Developer"}
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>

              <div className="glass-card rounded-[2rem] p-6 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Developed by
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-900 dark:text-white">
                  {profile?.display_name}
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
                  {profile?.role_title}
                </p>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {profile?.short_bio}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/80 bg-white/82 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:border-white/12 dark:bg-slate-900/92 dark:text-slate-200">
                    {profile?.location}
                  </span>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <a
                    href={`mailto:${profile?.inquiries_email}?subject=FairSplit%20Inquiry`}
                    className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02]"
                  >
                    Contact for Inquiries
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  {[
                    {
                      href: `mailto:${profile?.contact_email}`,
                      label: "Email",
                      icon: MailIcon,
                    },
                    {
                      href: profile?.github_url,
                      label: "GitHub",
                      icon: GitHubIcon,
                    },
                    {
                      href: profile?.linkedin_url,
                      label: "LinkedIn",
                      icon: LinkedInIcon,
                    },
                    {
                      href: profile?.website_url,
                      label: "Website",
                      icon: GlobeIcon,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.href?.startsWith("mailto:") ? undefined : "_blank"}
                        rel={item.href?.startsWith("mailto:") ? undefined : "noreferrer"}
                        aria-label={item.label}
                        title={item.label}
                        className="developer-social-stack group relative inline-flex h-20 w-20 items-center justify-center text-slate-700 dark:text-slate-100"
                      >
                        <span className="developer-social-layer developer-social-layer-3" aria-hidden="true" />
                        <span className="developer-social-layer developer-social-layer-2" aria-hidden="true" />
                        <span className="developer-social-layer developer-social-layer-1" aria-hidden="true" />
                        <span className="developer-social-face">
                          <Icon className="h-9 w-9" />
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
