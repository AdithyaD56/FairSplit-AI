import { Link } from "react-router-dom";

import { formatCurrency, formatDate } from "../utils/formatters";

export default function TripCard({ trip }) {
  return (
    <article className="glass-card rounded-[2rem] p-6 shadow-soft transition duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {formatDate(trip.created_at)}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
            {trip.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{trip.summary}</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-r from-brand-50 to-aqua-50 px-5 py-4 text-right dark:border dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/14">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Budget</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
            {formatCurrency(trip.budget_min)} - {formatCurrency(trip.budget_max)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-brand-100">
            {trip.destination}
          </span>
          <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-brand-100">
            {trip.days} days
          </span>
          <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-brand-100">
            {trip.travelers} travelers
          </span>
        </div>
        <Link
          to={`/trips/${trip.id}`}
          className="shimmer-button inline-flex rounded-full bg-gradient-to-r from-brand-600 via-berry-500 to-aqua-500 px-6 py-3 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
        >
          Open Trip
        </Link>
      </div>
    </article>
  );
}
