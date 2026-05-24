import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { authApi, getApiError } from "../services/api";

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const initialEmail = params.get("email") || "";
  const initialCodeSentAt = useMemo(
    () => (typeof location.state?.codeSentAt === "number" ? location.state.codeSentAt : null),
    [location.state],
  );
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    initialCodeSentAt ? "We sent a fresh verification code to your email." : "",
  );
  const [resendAvailableAt, setResendAvailableAt] = useState(
    initialCodeSentAt ? initialCodeSentAt + 30_000 : Date.now(),
  );
  const [clock, setClock] = useState(Date.now());
  const { completeExternalSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const resendSecondsLeft = Math.max(0, Math.ceil((resendAvailableAt - clock) / 1000));

  useEffect(() => {
    if (resendSecondsLeft <= 0) return undefined;

    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= resendAvailableAt) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt, resendSecondsLeft]);

  async function handleVerifyCode(event) {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Email is missing.");
      return;
    }
    if (!otp) {
      setError("Verification code is missing.");
      return;
    }
    setVerifying(true);
    try {
      const response = await authApi.verifyResetCode({ email, otp });
      setResetToken(response.reset_token);
      setVerified(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Email is missing.");
      return;
    }
    if (!otp) {
      setError("Verification code is missing.");
      return;
    }
    if (!verified) {
      setError("Please verify the code before changing your password.");
      return;
    }
    if (!resetToken) {
      setError("Your verified session expired. Please request a new code.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Use at least 8 characters with uppercase, lowercase, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      const session = await authApi.resetPassword({ reset_token: resetToken, new_password: password });
      completeExternalSession(session);
      navigate(session.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");

    if (!email) {
      setError("Enter your account email first.");
      return;
    }
    if (resendSecondsLeft > 0) {
      return;
    }

    setResending(true);
    try {
      const response = await authApi.forgotPassword({ email });
      setInfoMessage(response.message || "A new verification code has been sent if the email exists.");
      setOtp("");
      setVerified(false);
      setResetToken("");
      setResendAvailableAt(Date.now() + 30_000);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="animated-shell min-h-screen px-4 py-8 dark:text-slate-100">
      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="glass-card w-full rounded-[2.4rem] p-8 shadow-soft dark:border-white/12 dark:bg-slate-950/92 sm:p-10">
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
            Reset password
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-900 dark:text-white">
            Verify your code and set a new password
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            We sent a 6-digit code to your email. Verify it first, then choose a fresh password.
          </p>

          {infoMessage ? (
            <div className="mt-6 rounded-[1.4rem] bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
              {infoMessage}
            </div>
          ) : null}

          <form onSubmit={verified ? handleSubmit : handleVerifyCode} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Email</span>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setVerified(false);
                }}
                type="email"
                required
                disabled={verified}
                className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Verification code</span>
              <input
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setVerified(false);
                }}
                inputMode="numeric"
                maxLength={6}
                type="text"
                required
                disabled={verified}
                className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                placeholder="123456"
              />
            </label>

            {verified ? (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">New password</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    required
                    className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                    placeholder="Create a strong password"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Confirm new password
                  </span>
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type="password"
                    required
                    className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-white dark:focus:bg-slate-950"
                    placeholder="Repeat the new password"
                  />
                </label>
              </>
            ) : null}

            {error ? (
              <div className="rounded-[1.4rem] bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            {!verified ? (
              <div className="flex flex-col items-start gap-2 rounded-[1.4rem] border border-slate-200/90 bg-slate-50/90 px-5 py-4 dark:border-white/12 dark:bg-slate-900/70">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || resendSecondsLeft > 0}
                  className="text-sm font-bold text-brand-700 transition hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline dark:text-brand-200 dark:disabled:text-slate-500"
                >
                  {resending
                    ? "Sending new code..."
                    : resendSecondsLeft > 0
                      ? `Resend code in ${resendSecondsLeft}s`
                      : "Resend code"}
                </button>
                <p className="text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Need another OTP? You can request a fresh code every 30 seconds.
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || verifying}
              className="shimmer-button w-full rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {verified ? (loading ? "Updating..." : "Update password") : verifying ? "Verifying..." : "Verify code"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/auth" className="font-semibold text-brand-700 hover:underline dark:text-brand-200">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
