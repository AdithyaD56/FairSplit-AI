import { Link } from "react-router-dom";

import { formatCurrency } from "../utils/formatters";

function ActivityPill({ activity }) {
  return (
    <a
      href={activity.maps_search_url}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:bg-slate-800 dark:text-brand-100 dark:hover:bg-slate-700"
    >
      {activity.place_name}
    </a>
  );
}

export default function TripResultsPanel({ tripRecord }) {
  if (!tripRecord) return null;

  const generated = tripRecord.trip_data;
  const savedTripId = tripRecord.id > 0 ? tripRecord.id : null;
  const averagePerPerson =
    ((tripRecord.budget_min + tripRecord.budget_max) / 2) / Math.max(tripRecord.travelers, 1);

  return (
    <section className="space-y-6">
      <div className="glass-card rounded-[2rem] p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Generated trip draft
            </p>
            <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              {generated.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {generated.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {savedTripId ? (
              <Link
                to={`/trips/${savedTripId}`}
                className="shimmer-button inline-flex rounded-full bg-gradient-to-r from-brand-600 via-berry-500 to-aqua-500 px-6 py-3 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
              >
                Open Full Trip
              </Link>
            ) : null}
            <Link
              to="/trips"
              className="rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur-xl transition hover:-translate-y-1 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              View Trip Drafts
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-5">
          <div className="rounded-[1.5rem] bg-gradient-to-r from-brand-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Route
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {tripRecord.origin || "Flexible"} to {tripRecord.destination}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-r from-aqua-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Group
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {tripRecord.travelers} travelers · {tripRecord.group_type}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-r from-amber-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Budget
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {formatCurrency(tripRecord.budget_min)} - {formatCurrency(tripRecord.budget_max)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-r from-sun-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Average per traveler
            </p>
            <p className="mt-3 text-xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {formatCurrency(averagePerPerson)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-r from-rose-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              Interests
            </p>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-100">
              {tripRecord.interests.length ? tripRecord.interests.join(", ") : "Flexible"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card rounded-[2rem] p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Recommended stays
          </p>
          <div className="mt-6 space-y-4">
            {generated.hotels.map((hotel) => (
              <div
                key={`${hotel.hotel_name}-${hotel.area}`}
                className="rounded-[1.6rem] border border-brand-100 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/92"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {hotel.hotel_name}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-sky-200">
                      {hotel.area}
                    </p>
                  </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-50">
                      {hotel.rating ? `${hotel.rating} rating` : "Flexible"}
                    </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-100">{hotel.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-slate-50">
                    {hotel.price_per_night}
                  </span>
                  <a
                    href={hotel.maps_search_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-gradient-to-r from-brand-50 to-aqua-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:from-slate-800 dark:to-slate-900 dark:text-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800"
                  >
                    Open stay
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Day-wise itinerary
          </p>
          <div className="mt-6 space-y-4">
            {generated.itinerary.map((day) => (
              <div
                key={day.day}
                className="rounded-[1.6rem] border border-brand-100 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/92"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      Day {day.day}
                    </p>
                    <p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {day.day_plan}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-50">
                    {day.estimated_day_budget}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
                  Best time: {day.best_time_to_visit_day}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {day.activities.map((activity) => (
                    <ActivityPill
                      key={`${day.day}-${activity.place_name}`}
                      activity={activity}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
