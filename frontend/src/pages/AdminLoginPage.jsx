import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { getApiError } from "../services/api";

function PasswordEye({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7A3 3 0 0 0 15 15" />
      <path d="M9.9 5.1A11.4 11.4 0 0 1 12 5c6.4 0 10 7 10 7a19.8 19.8 0 0 1-4 4.8" />
      <path d="M6.6 6.7C4.2 8.3 2.8 10.5 2 12c0 0 3.6 7 10 7a11 11 0 0 0 4-.7" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [form, setForm] = useState({
    email: "admin@fairsplit.ai",
    password: "Admin@12345",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, logout, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [authLoading, navigate, user]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const nextUser = await login(form);
      if (nextUser.role !== "admin") {
        logout();
        setError("This page is for admin accounts only.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="animated-shell min-h-screen px-4 py-8 dark:text-slate-100">
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-3 pb-8">
          <Link
            to="/"
            className="text-2xl font-black tracking-[-0.04em] text-slate-900 dark:text-white"
          >
            FairSplit <span className="text-brand-600 dark:text-brand-200">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              to="/"
              className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              Back to Homescreen
            </Link>
            <Link
              to="/auth"
              className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              User Login
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.96fr_1.04fr]">
          <section className="glass-card rounded-[2.4rem] p-8 shadow-soft dark:border-white/10 dark:bg-slate-950/72 sm:p-10">
            <p className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Admin access
            </p>
            <h1 className="gradient-title mt-8 text-5xl font-black tracking-[-0.06em]">
              Admin control center login
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Use the seeded admin account to review users, inspect records, and manage the
              public app once it is deployed.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  type="email"
                  required
                  className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
                <div className="relative mt-2">
                  <input
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 pr-16 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-2 my-2 inline-flex items-center gap-2 rounded-full px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <PasswordEye visible={showPassword} />
                  </button>
                </div>
              </label>

              {error ? (
                <div className="rounded-[1.4rem] bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="shimmer-button w-full rounded-full bg-gradient-to-r from-slate-950 via-brand-700 to-coral-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Checking..." : "Enter Admin Dashboard"}
              </button>
            </form>
          </section>

          <section className="relative overflow-hidden rounded-[2.4rem] border border-white/75 bg-gradient-to-br from-brand-700 via-slate-900 to-slate-950 p-8 text-white shadow-neon dark:border-white/10 sm:p-10">
            <div className="hero-grid absolute inset-0 opacity-20" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                Protected entry
              </p>
              <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                <p className="text-xl font-black tracking-[-0.04em]">Admin access stays private.</p>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  This page is still active for seeded or custom admin credentials, but the
                  public home screen no longer exposes an admin shortcut before deployment.
                </p>
              </div>
              <p className="mt-8 max-w-sm text-sm leading-7 text-white/70">
                Keep the seeded admin account if you are testing, or override it through your
                backend environment variables before going public.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
