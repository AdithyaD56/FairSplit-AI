import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import TypedTagline from "../components/TypedTagline";
import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../hooks/useLiveEvents";
import { getApiError, reviewApi } from "../services/api";
import { formatDate } from "../utils/formatters";

const initialForm = {
  rating: 5,
  category: "general",
  title: "",
  message: "",
};

function StarPicker({ value, onChange, disabled }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`rounded-full px-3 py-2 text-2xl leading-none transition ${
              active
                ? "bg-amber-50 text-amber-500 shadow-soft dark:bg-amber-400/12 dark:text-amber-300"
                : "bg-slate-100 text-slate-300 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-600 dark:hover:bg-slate-800"
            } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
      <span className="ml-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {value} out of 5
      </span>
    </div>
  );
}

function RatingStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-lg leading-none text-amber-400 dark:text-amber-300">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sparkle, setSparkle] = useState(false);
  const { latestEvent } = useLiveEvents(token);

  async function loadReviews() {
    setLoading(true);
    setError("");

    try {
      const mine = await reviewApi.getMyReviews();
      setMyReviews(mine);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (!latestEvent || !user) return;
    if (user.role !== "admin" && latestEvent.user_id !== user.id) return;
    if (!latestEvent.type?.startsWith("review.")) return;
    loadReviews();
  }, [latestEvent, user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await reviewApi.createReview(form);
      setForm(initialForm);
      setSuccess("Your review is in. Thanks for helping us sharpen FairSplit.");
      setSparkle(true);
      window.setTimeout(() => setSparkle(false), 1600);
      await loadReviews();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2.2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Reviews
          </p>
          <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
            Tell us what feels sharp and what still needs polish.
          </h1>
          <TypedTagline
            phrases={[
              "A quick review helps us tighten the next release.",
              "Short feedback. Real product impact.",
              "Leave the signal, we will handle the cleanup.",
            ]}
            className="mt-5 max-w-3xl min-h-[3.75rem] text-sm font-semibold leading-8 text-slate-600 dark:text-slate-300 sm:text-base"
          />
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="glass-card rounded-[2rem] p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Leave a review
            </p>
            <form onSubmit={handleSubmit} className="relative mt-6 space-y-5 overflow-hidden">
              {sparkle ? (
                <div className="review-sparkle-burst" aria-hidden="true">
                  <span>★</span>
                  <span>✦</span>
                  <span>★</span>
                  <span>✦</span>
                  <span>★</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Rating</span>
                  <StarPicker
                    value={form.rating}
                    onChange={(rating) => setForm((current) => ({ ...current, rating }))}
                    disabled={submitting}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Category</span>
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="bill-splitter">Bill Splitter</option>
                    <option value="travel-workspace">Travel Workspace</option>
                    <option value="design">Design</option>
                    <option value="speed">Speed</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  maxLength={160}
                  className="mt-2 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Short headline for your review"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={updateField}
                  rows={6}
                  maxLength={1200}
                  className="mt-2 w-full resize-none rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="What felt useful? What still needs polish?"
                />
              </label>

              {error ? (
                <div className="rounded-[1.4rem] bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[1.4rem] bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="shimmer-button w-full rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Saving review..." : "Submit Review"}
              </button>
            </form>
          </section>

          <section className="space-y-8">
            <div className="glass-card rounded-[2rem] p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Your recent reviews
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Community-wide reviews stay inside the admin console. Here you can track only your own submissions.
              </p>
              <div className="mt-6 space-y-4">
                {loading ? (
                  <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Loading your reviews...
                  </div>
                ) : myReviews.length ? (
                  myReviews.map((review) => (
                    <article
                      key={`mine-${review.id}`}
                      className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                          {review.title}
                        </p>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                        {review.category}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {review.message}
                      </p>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(review.created_at)}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    You have not submitted a review yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
