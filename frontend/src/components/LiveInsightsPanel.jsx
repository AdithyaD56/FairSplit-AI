import { useEffect, useState } from "react";

import { expenseApi, getApiError } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";


const defaultFilters = {
  destination: "Goa",
  amount: 10000,
  from_currency: "INR",
  to_currency: "USD",
};


export default function LiveInsightsPanel() {
  const [filters, setFilters] = useState(defaultFilters);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshLiveData(nextFilters = filters, silent = false) {
    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await expenseApi.getLiveInsights(nextFilters);
      setLiveData(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    refreshLiveData(defaultFilters);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshLiveData(filters, true);
    }, 60000);

    return () => window.clearInterval(timer);
  }, [filters]);

  function updateField(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: name === "amount" ? Number(value) : value,
    }));
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Optional trip research
          </p>
          <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
            Live weather, FX rates, and map links.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Auto-refreshes every 60 seconds using Open-Meteo and Frankfurter so the group
            can compare destination conditions quickly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshLiveData(filters)}
          disabled={loading}
          className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-105 disabled:opacity-70"
        >
          {loading ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <input
          name="destination"
          value={filters.destination}
          onChange={updateField}
          placeholder="Destination"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="amount"
          value={filters.amount}
          onChange={updateField}
          type="number"
          min="1"
          placeholder="Amount"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="from_currency"
          value={filters.from_currency}
          onChange={updateField}
          maxLength={3}
          placeholder="From"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm uppercase text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="to_currency"
          value={filters.to_currency}
          onChange={updateField}
          maxLength={3}
          placeholder="To"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm uppercase text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
      </div>

      {error && (
        <div className="mt-6 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
          {error}
        </div>
      )}

      {liveData && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-aqua-50 via-white to-brand-50 p-6 dark:border dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              Weather now
            </p>
            <p className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {liveData.weather.place_name}, {liveData.weather.country || "Live destination"}
            </p>
            <p className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">
              {liveData.weather.temperature_c ?? "--"}°C · {liveData.weather.wind_speed_kmh ?? "--"} km/h
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{liveData.weather.summary}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Updated {formatDate(liveData.refreshed_at)}
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-br from-aqua-50 via-white to-amber-50 p-6 dark:border dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-sun-950/14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-berry-600">
              Currency now
            </p>
            <p className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
              {formatCurrency(
                liveData.currency.source_amount,
                liveData.currency.base_currency,
              )}
            </p>
            <p className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">
              {liveData.currency.converted_amount != null
                ? formatCurrency(
                    liveData.currency.converted_amount,
                    liveData.currency.quote_currency,
                  )
                : "--"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {liveData.currency.summary}
              {liveData.currency.rate ? ` · 1 ${liveData.currency.base_currency} = ${liveData.currency.rate} ${liveData.currency.quote_currency}` : ""}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Rate date {liveData.currency.rate_date || "N/A"}
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-white/85 p-6 xl:col-span-2 dark:border dark:border-white/10 dark:bg-slate-900/95">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              Quick destination links
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {liveData.places.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-gradient-to-r from-brand-50 to-aqua-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:from-slate-800 dark:to-slate-900 dark:text-brand-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {liveData.provider_status.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
