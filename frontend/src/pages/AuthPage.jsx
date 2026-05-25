import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthProviderButtons from "../components/AuthProviderButtons";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api, authApi, getApiError } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

const highlights = [
  "Instant split summaries for group trips, dinners, and mixed payers.",
  "Secure accounts with hashed passwords and token-based sessions.",
  "Built for quick access and clean group finance workflows.",
];

const modeOptions = ["login", "signup"];

const passwordRuleText =
  "Use at least 8 characters with uppercase, lowercase, a number, and a special character.";

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}

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

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const { user, login, signup, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [authLoading, navigate, user]);

  function redirectAfterAuth(nextUser) {
    const target = nextUser.role === "admin" ? "/admin" : "/dashboard";
    navigate(target, { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname !== target) {
        window.location.assign(target);
      }
    }, 150);
  }

  useEffect(() => {
    if (mode !== "login") {
      setShowForgotPassword(false);
      setForgotMessage("");
    }
  }, [mode]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === "signup" && !isStrongPassword(form.password)) {
      setError(passwordRuleText);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const nextUser =
        mode === "signup"
          ? await signup(form)
          : await login({ email: form.email, password: form.password });
      redirectAfterAuth(nextUser);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    setError("");
    setSocialLoading(provider);
    try {
      window.location.assign(new URL(`/oauth/${provider}/start`, api.defaults.baseURL).toString());
    } catch (err) {
      setError(getApiError(err));
      setSocialLoading("");
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) {
      setError("Please enter your email first.");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    setError("");

    try {
      const response = await authApi.forgotPassword({ email: forgotEmail });
      setForgotMessage(response.message || "If the email exists, a verification code has been prepared.");
      navigate(`/auth/reset-password?email=${encodeURIComponent(forgotEmail)}`, {
        replace: false,
        state: { codeSentAt: Date.now() },
      });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setForgotLoading(false);
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
              className="rounded-full border border-white/85 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-800 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
            >
              Back to Homescreen
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.08fr]">
          <section className="relative overflow-hidden rounded-[2.4rem] border border-white/75 bg-gradient-to-br from-slate-950 via-brand-700 to-coral-500 p-8 text-white shadow-neon dark:border-white/12 dark:from-slate-950 dark:via-slate-900 dark:to-brand-700 sm:p-10">
            <div className="hero-grid absolute inset-0 opacity-20" />
            <div className="relative">
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                Sign in to FairSplit
              </p>
              <h1 className="mt-10 max-w-lg text-5xl font-black tracking-[-0.07em] sm:text-6xl">
                Sign in and get straight to the split.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-white/78 sm:text-base">
                Sign in or create an account with email, Google, or GitHub and get
                straight to clear group settlements.
              </p>

              <div className="mt-10 space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-xl"
                  >
                    <p className="text-sm font-semibold leading-7 text-white/88">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2.4rem] p-8 shadow-soft dark:border-white/12 dark:bg-slate-950/90 sm:p-10">
            <div
              className="mode-switch-shell inline-grid w-full max-w-[18rem] grid-cols-2 rounded-full p-1"
              style={{ "--switch-index": modeOptions.indexOf(mode) }}
            >
              <span className="mode-switch-thumb" aria-hidden="true" />
              {modeOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    setError("");
                  }}
                  className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-[0.16em] transition duration-300 ${
                    mode === item
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                  aria-pressed={mode === item}
                >
                  {item}
                </button>
              ))}
            </div>

            <div key={mode} className="auth-mode-stage mt-8">
              <h2 className="gradient-title text-4xl font-black tracking-[-0.06em]">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                Use email and password, or pick a social account for instant login and signup.
              </p>

              <div className="mt-8">
                <AuthProviderButtons onSelect={handleSocialLogin} activeProvider={socialLoading} />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Or continue with email
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {mode === "signup" ? (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Name</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateField}
                      type="text"
                      required
                      className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                      placeholder="Your name"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Email</span>
                  <input
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    type="email"
                    required
                    className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Password</span>
                  <div className="relative mt-2">
                    <input
                      name="password"
                      value={form.password}
                      onChange={updateField}
                      type={showPassword ? "text" : "password"}
                      minLength={mode === "signup" ? 8 : 1}
                      required
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 pr-16 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                      placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
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
                  {mode === "signup" ? (
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">
                      {passwordRuleText}
                    </p>
                  ) : null}
                  {mode === "login" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword((current) => !current);
                        setForgotEmail(form.email);
                        setForgotMessage("");
                        setError("");
                      }}
                      className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 hover:underline dark:text-brand-200"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </label>

                {mode === "login" && showForgotPassword ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 dark:border-white/12 dark:bg-slate-900/95">
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Account email
                        </span>
                        <input
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                          type="email"
                          required
                          className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-950 dark:text-white"
                          placeholder="you@example.com"
                        />
                      </label>

                      {forgotMessage ? (
                        <div className="rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                          {forgotMessage}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={forgotLoading}
                        className="w-full rounded-full border border-brand-500 bg-brand-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-brand-300 dark:bg-brand-400/12 dark:text-brand-100 dark:hover:bg-brand-400/18"
                      >
                        {forgotLoading ? "Preparing code..." : "Send verification code"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-[1.4rem] bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="shimmer-button w-full rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                {mode === "login"
                  ? "New here? Switch to sign up and create your account instantly."
                  : "Already have an account? Switch back to login."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
