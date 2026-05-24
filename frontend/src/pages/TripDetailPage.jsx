import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import { getApiError, tripApi } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function TripDetailPage() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTrip() {
      setLoading(true);
      setError("");

      try {
        const record = await tripApi.getTrip(tripId);
        if (isMounted) setTrip(record);
      } catch (err) {
        if (isMounted) setError(getApiError(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrip();
    return () => {
      isMounted = false;
    };
  }, [tripId]);

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Trip detail
            </p>
            <h1 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              {trip?.title || "Loading trip"}
            </h1>
          </div>
          <Link
            to="/trips"
            className="rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur-xl transition hover:-translate-y-1 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
          >
            Back To My Trips
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-soft dark:border-white/10 dark:bg-slate-950/68 dark:text-slate-300">
            Loading trip detail...
          </div>
        ) : null}

        {error && !loading ? (
          <div className="mt-10 rounded-3xl bg-rose-50 px-6 py-5 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {trip ? (
          <div className="mt-10 space-y-6">
            <section className="glass-card rounded-[2rem] p-6 shadow-soft sm:p-8">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                <div>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{trip.summary}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {trip.interests.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-brand-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:bg-slate-800 dark:text-slate-50"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-gradient-to-r from-brand-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      Route
                    </p>
                    <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {trip.origin || "Flexible"} to {trip.destination}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-gradient-to-r from-aqua-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      Budget
                    </p>
                    <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {formatCurrency(trip.budget_min)} - {formatCurrency(trip.budget_max)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-gradient-to-r from-amber-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      Travel setup
                    </p>
                    <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {trip.days} days · {trip.travelers} travelers
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-gradient-to-r from-aqua-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                      Style
                    </p>
                    <p className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                      {trip.group_type} · {trip.stay_type}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="glass-card rounded-[2rem] p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                  Hotels and stays
                </p>
                <div className="mt-6 space-y-4">
                  {trip.trip_data.hotels.map((hotel) => (
                    <div
                      key={`${hotel.hotel_name}-${hotel.area}`}
                      className="rounded-[1.6rem] border border-brand-100 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                            {hotel.hotel_name}
                          </p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                            {hotel.area}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                          {hotel.rating ? `${hotel.rating} rating` : hotel.price_per_night}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{hotel.description}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
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
                  Itinerary
                </p>
                <div className="mt-6 space-y-4">
                  {trip.trip_data.itinerary.map((day) => (
                    <div key={day.day} className="rounded-[1.6rem] border border-brand-100 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-900/70">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                            Day {day.day}
                          </p>
                          <p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                            {day.day_plan}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                          {day.estimated_day_budget}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Best time: {day.best_time_to_visit_day}
                      </p>
                      <div className="mt-4 space-y-3">
                        {day.activities.map((activity) => (
                          <div
                            key={`${day.day}-${activity.place_name}`}
                            className="rounded-[1.2rem] bg-slate-50 p-4 dark:bg-slate-950/80"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {activity.place_name}
                                </p>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">
                                  {activity.area}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                                {activity.ticket_pricing}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                              {activity.place_details}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                                {activity.best_time_to_visit}
                              </span>
                              <span className="rounded-full bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                                {activity.time_travel_each_location}
                              </span>
                              <a
                                href={activity.maps_search_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-gradient-to-r from-brand-50 to-aqua-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:from-slate-800 dark:to-slate-900 dark:text-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800"
                              >
                                Open location
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="glass-card rounded-[2rem] p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                  Budget breakdown
                </p>
                <div className="mt-6 space-y-3">
                  {trip.trip_data.budget_categories.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between rounded-[1.2rem] bg-white/70 px-4 py-3 dark:bg-slate-900/70"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.category}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          Per person {formatCurrency(item.per_person_min)} - {formatCurrency(item.per_person_max)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-brand-700">
                        {formatCurrency(item.min_amount)} - {formatCurrency(item.max_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-[2rem] p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                  Planning notes and links
                </p>
                <div className="mt-6 space-y-3">
                  {trip.trip_data.planning_notes.map((note) => (
                    <div key={note} className="rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                      {note}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {trip.trip_data.essential_links.map((item) => (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-gradient-to-r from-brand-50 to-aqua-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:from-slate-800 dark:to-slate-900 dark:text-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
