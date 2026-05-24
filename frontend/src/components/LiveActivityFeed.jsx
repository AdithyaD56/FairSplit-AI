import { useMemo } from "react";

import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../hooks/useLiveEvents";
import { formatDate, formatCurrency } from "../utils/formatters";

function describeEvent(event) {
  if (!event) return "";
  if (event.type === "expense.created") {
    return `Split saved for ${formatCurrency(event.payload?.total_amount || 0)}`;
  }
  if (event.type === "trip.created") {
    return `Trip draft saved for ${event.payload?.destination || "your trip"}`;
  }
  if (event.type === "review.created") {
    return `Review posted: ${event.payload?.title || "new feedback"}`;
  }
  if (event.type === "expense.deleted") {
    return "An expense record was removed";
  }
  if (event.type === "user.deleted") {
    return "A user account was removed";
  }
  if (event.type === "connected") {
    return "Connected to live updates";
  }
  return event.payload?.message || "Live update received";
}

export default function LiveActivityFeed() {
  const { user, token } = useAuth();
  const { connected, events } = useLiveEvents(token);

  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        if (!event) return false;
        if (user?.role === "admin") return true;
        return event.user_id === user?.id || event.type === "connected";
      }),
    [events, user?.id, user?.role],
  );

  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Live feed
          </p>
          <h2 className="gradient-title mt-2 text-2xl font-black tracking-[-0.05em]">
            Updates arriving in real time
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
          {connected ? "WebSocket connected" : "Waiting for live connection"}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleEvents.length ? (
          visibleEvents.map((event, index) => (
            <article
              key={`${event.type}-${event.created_at}-${index}`}
              className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">
                    {event.actor?.name || "FairSplit"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {describeEvent(event)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {event.type.replace(".", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {formatDate(event.created_at)}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Create a split, trip draft, or review in another tab and the update will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
