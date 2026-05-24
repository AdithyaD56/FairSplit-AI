import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

function decodeUserPayload(raw) {
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { completeExternalSession } = useAuth();
  const [error, setError] = useState("");

  const token = params.get("token");
  const encodedUser = params.get("user");
  const providerError = params.get("error");

  const subtitle = useMemo(() => {
    if (providerError || error) return "We could not finish the sign-in. You can safely head back and try again.";
    return "Hold on for a moment while we bring your social sign-in back into FairSplit.";
  }, [error, providerError]);

  useEffect(() => {
    if (providerError) {
      setError(providerError);
      return;
    }
    if (!token || !encodedUser) {
      setError("Missing login session from the provider callback.");
      return;
    }

    try {
      const user = decodeUserPayload(encodedUser);
      const nextUser = completeExternalSession({
        access_token: token,
        user,
      });
      navigate(nextUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch {
      setError("We could not read the provider response. Please try that sign-in again.");
    }
  }, [completeExternalSession, encodedUser, navigate, providerError, token]);

  return (
    <main className="animated-shell min-h-screen px-4 py-8 dark:text-slate-100">
      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="glass-card w-full rounded-[2.4rem] p-8 text-center shadow-soft dark:border-white/12 dark:bg-slate-950/92 sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="text-2xl font-black tracking-[-0.04em] text-slate-900 dark:text-white"
            >
              FairSplit <span className="text-brand-600 dark:text-brand-200">AI</span>
            </Link>
            <ThemeToggle compact />
          </div>

          <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
            Social sign-in
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900 dark:text-white">
            {error ? "Sign-in needs another try" : "Finishing your login"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{subtitle}</p>

          {error ? (
            <>
              <div className="mt-8 rounded-[1.5rem] bg-rose-50 px-5 py-4 text-left text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                {error}
              </div>
              <Link
                to="/auth"
                className="mt-8 inline-flex rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-neon transition hover:scale-[1.01]"
              >
                Back to login
              </Link>
            </>
          ) : (
            <div className="mt-10 flex items-center justify-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex h-3 w-3 rounded-full bg-brand-500 animate-pulse" />
              Verifying your provider session and opening the app...
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
