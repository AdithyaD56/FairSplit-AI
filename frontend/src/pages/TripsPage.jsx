import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import TripCard from "../components/TripCard";
import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../hooks/useLiveEvents";
import { getApiError, tripApi } from "../services/api";

export default function TripsPage() {
  const { user, token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { latestEvent } = useLiveEvents(token);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const records = await tripApi.getTrips();
      setTrips(records);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    if (!latestEvent || !user) return;
    if (user.role !== "admin" && latestEvent.user_id !== user.id) return;
    if (!latestEvent.type?.startsWith("trip.")) return;
    loadTrips();
  }, [latestEvent, loadTrips, user]);

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Trip drafts
            </p>
            <h1 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              Saved planning drafts
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Reopen saved trip drafts, compare budgets, and use them only when your group
              needs pre-planning before the actual split.
            </p>
          </div>
          <Link
            to="/trip-planner"
            className="shimmer-button inline-flex rounded-full bg-gradient-to-r from-brand-600 via-berry-500 to-aqua-500 px-6 py-3 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
          >
            Back To Travel Workspace
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-soft dark:border-white/10 dark:bg-slate-950/68 dark:text-slate-300">
            Loading your saved trips...
          </div>
        ) : null}

        {error && !loading ? (
          <div className="mt-10 rounded-3xl bg-rose-50 px-6 py-5 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && trips.length === 0 ? (
          <div className="glass-card mt-10 rounded-3xl p-10 text-center shadow-soft">
            <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
              No trip drafts saved yet
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Generate a trip draft from the travel workspace or the planner bot and it will appear here automatically.
            </p>
          </div>
        ) : null}

        <div className="mt-10 space-y-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </main>
    </div>
  );
}
