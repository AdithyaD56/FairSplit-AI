import { useEffect, useMemo, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import { useLiveEvents } from "../hooks/useLiveEvents";
import StatCard from "../components/StatCard";
import TypedTagline from "../components/TypedTagline";
import { useAuth } from "../context/AuthContext";
import { adminApi, api, getApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";

function normalizeLiveExpense(event) {
  if (event?.type !== "expense.created" || !event?.payload) return null;
  return {
    id: event.payload.id,
    user_id: event.payload.user_id,
    user_email: event.payload.user_email || "",
    user_name: event.actor?.name || "User",
    scenario: event.payload.scenario || "",
    total_amount: event.payload.total_amount || 0,
    payer_name: event.payload.payer_name || "",
    participants: event.payload.participants || [],
    shares: event.payload.shares || [],
    settlements: event.payload.settlements || [],
    created_at: event.payload.created_at,
  };
}

function statusBadge(status) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  if (status === "recent") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
  }
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

function RatingStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-base leading-none text-amber-400 dark:text-amber-300">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

function DonutChart({ title, segments = [], subtitle }) {
  const total = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="glass-card rounded-[1.8rem] p-5 shadow-soft dark:border-white/12 dark:bg-slate-950/90">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-200">{title}</p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid h-32 w-32 place-items-center rounded-full bg-slate-50/90 dark:bg-slate-900/95">
          <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(100,116,139,0.22)" strokeWidth="14" />
            {segments.map((segment) => {
              const value = Number(segment.value || 0);
              const dash = total ? (value / total) * circumference : 0;
              const currentOffset = offset;
              offset += dash;
              return (
                <circle
                  key={segment.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-currentOffset}
                />
              );
            })}
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">{total}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Total</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-slate-200/80 bg-white/70 px-3 py-2.5 dark:border-white/8 dark:bg-slate-900/85"
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{segment.label}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white">{segment.value}</span>
            </div>
          ))}
          <p className="pt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}

function ActivityLineChart({ points = [] }) {
  const chartHeight = 220;
  const chartWidth = 540;
  const padding = 26;
  const maxValue = Math.max(...points.map((point) => point.total || 0), 1);

  function buildLinePath(key) {
    if (!points.length) return "";
    return points
      .map((point, index) => {
        const x = padding + (index * (chartWidth - padding * 2)) / Math.max(points.length - 1, 1);
        const y = chartHeight - padding - ((point[key] || 0) / maxValue) * (chartHeight - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <section className="glass-card rounded-[2rem] p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/90">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-200">Activity timeline</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">Last 7 days of user activity</h3>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.16em]">
          {[["Users", "#16a3b8"], ["Splits", "#ff8b61"], ["Trips", "#8f79ff"], ["Reviews", "#26c281"]].map(
            ([label, color]) => (
              <span key={label} className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[1.5rem] border border-slate-200/80 bg-white/72 p-4 dark:border-white/8 dark:bg-slate-900/85">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-64 w-full min-w-[32rem]">
          {Array.from({ length: 5 }, (_, index) => {
            const y = padding + (index * (chartHeight - padding * 2)) / 4;
            return (
              <line
                key={index}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="rgba(148,163,184,0.18)"
                strokeDasharray="4 6"
              />
            );
          })}
          <path d={buildLinePath("users")} fill="none" stroke="#16a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d={buildLinePath("splits")} fill="none" stroke="#ff8b61" strokeWidth="3" strokeLinecap="round" />
          <path d={buildLinePath("trips")} fill="none" stroke="#8f79ff" strokeWidth="3" strokeLinecap="round" />
          <path d={buildLinePath("reviews")} fill="none" stroke="#26c281" strokeWidth="3" strokeLinecap="round" />
          {points.map((point, index) => {
            const x = padding + (index * (chartWidth - padding * 2)) / Math.max(points.length - 1, 1);
            return (
              <text
                key={point.label}
                x={x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-bold uppercase tracking-[0.14em] dark:fill-slate-400"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [developerForm, setDeveloperForm] = useState({
    display_name: "",
    role_title: "",
    short_bio: "",
    contact_email: "",
    inquiries_email: "",
    avatar_url: "",
    location: "",
    website_url: "",
    github_url: "",
    linkedin_url: "",
  });
  const [expenseSearch, setExpenseSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingDeveloper, setSavingDeveloper] = useState(false);
  const [developerDirty, setDeveloperDirty] = useState(false);
  const [developerSuccess, setDeveloperSuccess] = useState("");
  const [error, setError] = useState("");
  const developerDirtyRef = useRef(false);
  const { latestEvent } = useLiveEvents(token);
  const developerAvatarPreview = developerForm.avatar_url?.startsWith("/")
    ? `${api.defaults.baseURL}${developerForm.avatar_url}`
    : developerForm.avatar_url;

  async function loadAdminData({ quiet = false } = {}) {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const requests = quiet
        ? [
            adminApi.getOverview(),
            adminApi.getUsers(),
            adminApi.getExpenses(),
            adminApi.getReviews(),
          ]
        : [
            adminApi.getOverview(),
            adminApi.getUsers(),
            adminApi.getExpenses(),
            adminApi.getReviews(),
            adminApi.getDeveloperProfile(),
          ];
      const results = await Promise.all(requests);
      const [overviewData, usersData, expensesData, reviewsData, developerData] = results;
      setOverview(overviewData);
      setUsers(usersData);
      setExpenses(expensesData);
      setReviews(reviewsData);
      if (developerData && !developerDirtyRef.current) {
        setDeveloperForm({
          display_name: developerData.display_name,
          role_title: developerData.role_title,
          short_bio: developerData.short_bio,
          contact_email: developerData.contact_email,
          inquiries_email: developerData.inquiries_email,
          avatar_url: developerData.avatar_url,
          location: developerData.location,
          website_url: developerData.website_url,
          github_url: developerData.github_url,
          linkedin_url: developerData.linkedin_url,
        });
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadAdminData({ quiet: true });
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!latestEvent) return;
    if (latestEvent.type === "expense.created") {
      const liveExpense = normalizeLiveExpense(latestEvent);
      if (liveExpense) {
        setExpenses((current) => {
          if (current.some((item) => item.id === liveExpense.id)) {
            return current;
          }
          return [liveExpense, ...current];
        });
        setOverview((current) =>
          current
            ? {
                ...current,
                total_splits: current.total_splits + 1,
                total_amount: Number(current.total_amount || 0) + Number(liveExpense.total_amount || 0),
                live_split_events_24h: Number(current.live_split_events_24h || 0) + 1,
              }
            : current,
        );
      }
    }
    if (latestEvent.type === "expense.deleted") {
      const removedExpenseId = latestEvent.payload?.expense_id;
      if (removedExpenseId) {
        setExpenses((current) => current.filter((item) => item.id !== removedExpenseId));
      }
    }
    loadAdminData({ quiet: true });
  }, [latestEvent]);

  async function handleDeleteUser(userId) {
    if (!window.confirm("Delete this user and all their expense history?")) return;
    try {
      await adminApi.deleteUser(userId);
      await loadAdminData({ quiet: true });
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleDeleteExpense(expenseId) {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await adminApi.deleteExpense(expenseId);
      await loadAdminData({ quiet: true });
    } catch (err) {
      setError(getApiError(err));
    }
  }

  function handleDeveloperFieldChange(event) {
    const { name, value } = event.target;
    setDeveloperForm((current) => ({ ...current, [name]: value }));
    setDeveloperDirty(true);
    developerDirtyRef.current = true;
    setDeveloperSuccess("");
  }

  async function handleDeveloperSave(event) {
    event.preventDefault();
    setSavingDeveloper(true);
    setError("");
    setDeveloperSuccess("");
    try {
      const saved = await adminApi.updateDeveloperProfile(developerForm);
      setDeveloperForm({
        display_name: saved.display_name,
        role_title: saved.role_title,
        short_bio: saved.short_bio,
        contact_email: saved.contact_email,
        inquiries_email: saved.inquiries_email,
        avatar_url: saved.avatar_url,
        location: saved.location,
        website_url: saved.website_url,
        github_url: saved.github_url,
        linkedin_url: saved.linkedin_url,
      });
      setDeveloperDirty(false);
      developerDirtyRef.current = false;
      setDeveloperSuccess("Developer profile updated.");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSavingDeveloper(false);
    }
  }

  async function handleDeveloperAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    setDeveloperSuccess("");
    try {
      const uploaded = await adminApi.uploadDeveloperAvatar(file);
      setDeveloperForm((current) => ({
        ...current,
        avatar_url: uploaded.avatar_url,
      }));
      setDeveloperDirty(true);
      developerDirtyRef.current = true;
      setDeveloperSuccess("Avatar uploaded. Save the profile to publish it.");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  const filteredExpenses = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    if (!query) return expenses;
    return expenses.filter((expense) =>
      [
        expense.user_name,
        expense.user_email,
        expense.payer_name,
        expense.scenario,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [expenses, expenseSearch]);

  const marqueeReviews = reviews.length > 1 ? [...reviews, ...reviews] : reviews;

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Admin dashboard
            </p>
            <h1 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              Live platform control room
            </h1>
            <TypedTagline
              phrases={[
                "Watch usage, feedback, and activity without leaving one screen.",
                "Track active users, recent reviews, and fresh spend in one pulse.",
                "See the product like an operator, not just a page owner.",
              ]}
              className="mt-4 min-h-[3.5rem] max-w-3xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300"
            />
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 text-sm shadow-soft dark:border-white/12 dark:bg-slate-950/80">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Refresh status
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {refreshing ? "Refreshing live snapshot..." : lastUpdated ? `Last synced ${formatDate(lastUpdated)}` : "Waiting for first load"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={overview?.total_users ?? 0}
            caption="Every registered account currently inside the system."
          />
          <StatCard
            label="Total splits"
            value={overview?.total_splits ?? 0}
            caption="All stored FairSplit analyses across the user base."
          />
          <StatCard
            label="Trip drafts"
            value={overview?.total_trip_drafts ?? 0}
            caption="Saved travel drafts created from the travel workspace."
          />
          <StatCard
            label="Tracked volume"
            value={formatCurrency(overview?.total_amount ?? 0)}
            caption="Total expense volume processed through the app."
          />
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl bg-rose-50 px-6 py-5 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-soft dark:border-white/10 dark:bg-slate-950/68 dark:text-slate-300">
            Loading admin data...
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <section className="glass-card rounded-[2rem] p-6 shadow-soft">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                    Live activity
                  </p>
                  <h2 className="gradient-title mt-3 text-2xl font-black tracking-[-0.05em]">
                    Active, recent, and offline at a glance
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 review-live-dot" />
                  Live polling every 30s
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(overview?.live_metrics || []).map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-[1.6rem] border border-white/70 bg-white/82 p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900/92"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                      {metric.value}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {metric.note}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
                  Sign-in mix
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(overview?.auth_breakdown || []).map((item) => (
                    <article
                      key={item.method}
                      className="rounded-[1.6rem] border border-white/70 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                            {item.method}
                          </p>
                          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                            {item.count}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                            item.enabled
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {item.enabled ? "Live" : "Not enabled"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.note}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
                  Demand snapshot
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ["New users in 7 days", overview?.recent_users_7d ?? 0],
                    ["Users with splits", overview?.users_with_splits ?? 0],
                    ["Users with trip drafts", overview?.users_with_trip_drafts ?? 0],
                    ["Avg splits per user", Number(overview?.avg_splits_per_user ?? 0).toFixed(2)],
                    ["Avg split value", formatCurrency(overview?.avg_split_value ?? 0)],
                    ["Avg review rating", `${Number(overview?.avg_review_rating ?? 0).toFixed(1)}/5`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                        {label}
                      </p>
                      <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <DonutChart
                title="User status"
                segments={overview?.user_status_breakdown || []}
                subtitle="Live segmentation of active, recent, and offline accounts."
              />
              <DonutChart
                title="Product activity mix"
                segments={overview?.product_activity_breakdown || []}
                subtitle="Distribution across expense splits, trip drafts, and reviews."
              />
            </div>

            <ActivityLineChart points={overview?.activity_timeline_7d || []} />

            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
                      Community reviews
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Visible only inside the admin console.
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-slate-50">
                    {overview?.feedback_status}
                  </span>
                </div>

                <div className="mt-6 rounded-[1.7rem] border border-white/70 bg-white/78 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                  {reviews.length ? (
                    <div className="review-marquee-window h-[26rem] overflow-hidden">
                      <div className={`review-marquee-track ${reviews.length > 2 ? "is-animated" : ""}`}>
                        {marqueeReviews.map((review, index) => (
                          <article
                            key={`${review.id}-${index}`}
                            className="mb-4 rounded-[1.5rem] border border-white/70 bg-white/84 p-5 dark:border-slate-700 dark:bg-slate-950/88"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                                  {review.title}
                                </p>
                                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                                  {review.user_name} · {review.category}
                                </p>
                              </div>
                              <RatingStars rating={review.rating} />
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                              {review.message}
                            </p>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(review.created_at)}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      No reviews yet. Once users submit feedback, this stream will fill in here.
                    </div>
                  )}
                </div>
              </section>

              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
                  Top destinations
                </h2>
                <div className="mt-6 space-y-4">
                  {overview?.top_destinations?.length ? (
                    overview.top_destinations.map((item) => (
                      <div
                        key={item.destination}
                        className="flex items-center justify-between rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">
                            Destination
                          </p>
                          <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                            {item.destination}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                            Drafts
                          </p>
                          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                            {item.count}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      No trip drafts have been saved yet, so destination demand is still empty.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">Users</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Activity status is inferred from recent splits, drafts, reviews, and signups.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {users.length} accounts
                  </span>
                </div>

                <div className="mt-6 max-h-[34rem] space-y-4 overflow-y-auto pr-1">
                  {users.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-white/70 bg-white/78 p-5 transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/70">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-bold text-slate-900 dark:text-white">{item.name}</p>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${statusBadge(item.activity_status)}`}>
                              {item.activity_status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.email}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {item.role} · {item.expense_count} splits · {item.trip_count} trips · {item.review_count} reviews
                          </p>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Last activity: {formatDate(item.last_activity_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(item.id)}
                          disabled={item.id === user?.id}
                          className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-500/12 dark:text-rose-200 dark:hover:bg-rose-500/18"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card rounded-[2rem] p-6 shadow-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">Expenses</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Search inside stored scenarios without letting the list take over the whole page.
                    </p>
                  </div>
                  <input
                    value={expenseSearch}
                    onChange={(event) => setExpenseSearch(event.target.value)}
                    placeholder="Search name, email, payer, or scenario"
                    className="w-full rounded-full border border-white/70 bg-white/82 px-5 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:max-w-sm"
                  />
                </div>

                <div className="mt-6 max-h-[34rem] space-y-4 overflow-y-auto pr-1">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-3xl border border-white/70 bg-white/78 p-5 transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
                            {expense.user_name} · {formatCurrency(expense.total_amount)}
                          </p>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {expense.user_email}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{expense.scenario}</p>
                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(expense.created_at)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:bg-slate-800 dark:text-slate-50">
                        Paid by {expense.payer_name} · {expense.settlements.length} settlements
                      </div>
                    </div>
                  ))}

                  {!filteredExpenses.length ? (
                    <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      No expenses matched that search.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <section className="glass-card rounded-[2rem] p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                    Developer profile
                  </p>
                  <h2 className="gradient-title mt-3 text-2xl font-black tracking-[-0.05em]">
                    Edit the public Developers page
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Public page content
                </span>
              </div>

              <form onSubmit={handleDeveloperSave} className="mt-6 grid gap-6 xl:grid-cols-[16rem_1fr]">
                <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-4 dark:border-white/12 dark:bg-slate-900/92">
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 dark:border-white/12 dark:bg-slate-950/90">
                    <img
                      src={developerAvatarPreview}
                      alt={developerForm.display_name || "Developer preview"}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Live preview
                    </p>
                    <label className="block">
                      <span className="sr-only">Upload avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDeveloperAvatarUpload}
                        className="hidden"
                      />
                      <span className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/82 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/92 dark:text-slate-100">
                        {uploadingAvatar ? "Uploading..." : "Upload from device"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Display name</span>
                    <input
                      name="display_name"
                      value={developerForm.display_name}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Role title</span>
                    <input
                      name="role_title"
                      value={developerForm.role_title}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Short bio</span>
                    <textarea
                      name="short_bio"
                      value={developerForm.short_bio}
                      onChange={handleDeveloperFieldChange}
                      rows={4}
                      className="mt-2 w-full resize-none rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Contact email</span>
                    <input
                      name="contact_email"
                      value={developerForm.contact_email}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Inquiries email</span>
                    <input
                      name="inquiries_email"
                      value={developerForm.inquiries_email}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Avatar URL</span>
                    <input
                      name="avatar_url"
                      value={developerForm.avatar_url}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Location</span>
                    <input
                      name="location"
                      value={developerForm.location}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live working URL</span>
                    <input
                      name="website_url"
                      value={developerForm.website_url}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">GitHub URL</span>
                    <input
                      name="github_url"
                      value={developerForm.github_url}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">LinkedIn URL</span>
                    <input
                      name="linkedin_url"
                      value={developerForm.linkedin_url}
                      onChange={handleDeveloperFieldChange}
                      className="mt-2 w-full rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900 dark:text-white"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {developerSuccess ? (
                      <div className="rounded-[1.1rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                        {developerSuccess}
                      </div>
                    ) : <div />}
                    <button
                      type="submit"
                      disabled={savingDeveloper}
                      className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingDeveloper ? "Saving..." : "Save Developer Profile"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
