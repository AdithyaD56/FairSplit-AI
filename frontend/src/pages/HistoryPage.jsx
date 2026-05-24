import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import HistoryCard from "../components/HistoryCard";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../hooks/useLiveEvents";
import { expenseApi, getApiError } from "../services/api";

export default function HistoryPage() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { latestEvent } = useLiveEvents(token);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const records = await expenseApi.getHistory();
      setHistory(records);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!latestEvent || !user) return;
    if (user.role !== "admin" && latestEvent.user_id !== user.id) return;
    if (!latestEvent.type?.startsWith("expense.")) return;
    loadHistory();
  }, [latestEvent, loadHistory, user]);

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Expense history
            </p>
            <h1 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              Past split calculations
            </h1>
          </div>
          <Link
            to="/settlements"
            className="shimmer-button inline-flex rounded-full bg-gradient-to-r from-brand-600 via-berry-500 to-aqua-500 px-6 py-3 text-sm font-semibold text-white shadow-neon transition hover:scale-105"
          >
            New Split
          </Link>
        </div>

        {loading && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-soft dark:border-white/12 dark:bg-slate-950/88 dark:text-slate-200">
            Loading your previous splits...
          </div>
        )}

        {error && !loading && (
          <div className="mt-10 rounded-3xl bg-rose-50 px-6 py-5 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="glass-card mt-10 rounded-3xl p-10 text-center shadow-soft">
            <h2 className="gradient-title text-2xl font-black tracking-[-0.05em]">
              No saved splits yet
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Run your first scenario from the dashboard and it will appear here automatically.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {history.map((record) => (
            <HistoryCard key={record.id} record={record} />
          ))}
        </div>
      </main>
    </div>
  );
}
