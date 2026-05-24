import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AssistantAvatarStrip from "../components/AssistantAvatarStrip";
import BrandVisualShowcase from "../components/BrandVisualShowcase";
import LiveInsightsPanel from "../components/LiveInsightsPanel";
import Navbar from "../components/Navbar";
import PopularDestinationsStrip from "../components/PopularDestinationsStrip";
import TravelAssistantWidget from "../components/TravelAssistantWidget";
import TypedTagline from "../components/TypedTagline";
import TripPlannerPanel, { defaultTripPlanForm } from "../components/TripPlannerPanel";
import TripResultsPanel from "../components/TripResultsPanel";
import { getApiError, tripApi } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function TravelPlannerPage() {
  const [planForm, setPlanForm] = useState({ ...defaultTripPlanForm });
  const [planResult, setPlanResult] = useState(null);
  const [tripRecord, setTripRecord] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");

  const averagePerTraveler = useMemo(() => {
    if (!planResult) return 0;
    return (planResult.per_person_min + planResult.per_person_max) / 2;
  }, [planResult]);

  useEffect(() => {
    setTripRecord(null);
    setDraftError("");
  }, [planResult]);

  function applyDestinationSuggestion(place) {
    setPlanForm((current) => ({
      ...current,
      destination: place.name,
      stay_type:
        current.stay_type && current.stay_type !== defaultTripPlanForm.stay_type
          ? current.stay_type
          : "smart budget stay",
      travel_mode:
        current.travel_mode && current.travel_mode !== defaultTripPlanForm.travel_mode
          ? current.travel_mode
          : place.journeyType,
      interests: Array.from(
        new Set([...current.interests, place.name.toLowerCase(), "food", "sightseeing"]),
      ).slice(0, 8),
      notes: [current.notes, `Selected from destination guide: ${place.quickNote}`]
        .filter(Boolean)
        .join(" "),
    }));
    setPlanResult(null);
    window.setTimeout(() => {
      document.getElementById("trip-planner-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function handleSaveTripDraft() {
    setSavingDraft(true);
    setDraftError("");

    try {
      const record = await tripApi.generateTrip({
        ...planForm,
        save: true,
      });
      setTripRecord(record);
      window.dispatchEvent(new Event("fairsplit-notification-updated"));
    } catch (err) {
      setDraftError(getApiError(err));
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <div className="animated-shell min-h-screen dark:text-slate-100">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 xl:grid-cols-[0.96fr_1.04fr]">
          <div className="rounded-[2.2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Travel workspace
            </p>
            <h1 className="gradient-title mt-3 text-5xl font-black tracking-[-0.07em] sm:text-6xl">
              Plan, scout, and book from one travel workspace.
            </h1>
            <TypedTagline
              phrases={[
                "One prompt. One route. One cleaner travel flow.",
                "Scout smart stays, tighter routes, and booking shortcuts fast.",
                "Draft the trip before the group starts spending.",
              ]}
              className="mt-5 max-w-2xl min-h-[3.75rem] text-sm font-semibold leading-8 text-slate-600 dark:text-slate-300 sm:text-base"
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Main focus", "Trip drafts, routes, and booking help"],
                ["Bot mode", "Planner and scout tools together"],
                ["Split logic", "Still kept on the Bill Splitter page"],
              ].map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-[1.6rem] bg-gradient-to-br from-white to-brand-50 px-4 py-4 shadow-soft dark:from-slate-900/95 dark:to-brand-950/40"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">{value}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                to="/dashboard"
                className="rounded-full border border-white/85 bg-white/95 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-slate-800 shadow-soft transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
              >
                Open Bill Splitter
              </Link>
              <Link
                to="/trips"
                className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02]"
              >
                View Trip Drafts
              </Link>
            </div>
          </div>

          <BrandVisualShowcase compact />
        </section>

        <TripPlannerPanel
          planForm={planForm}
          setPlanForm={setPlanForm}
          planResult={planResult}
          setPlanResult={setPlanResult}
        />

        <div className="mt-8">
          <AssistantAvatarStrip />
        </div>

        {planResult ? (
          <section className="mt-8 rounded-[2rem] border border-white/85 bg-gradient-to-br from-white via-brand-50/70 to-sun-50/80 p-6 shadow-soft dark:border-white/12 dark:from-slate-950/95 dark:via-brand-950/30 dark:to-slate-900/95 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                  Save this trip
                </p>
                <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
                  Turn the budget plan into a saved trip draft.
                </h2>
                <TypedTagline
                  phrases={[
                    "Save the route while the budget still feels clear.",
                    "Lock the draft before the group starts comparing screenshots.",
                    "Keep the per-person estimate ready for faster decisions.",
                  ]}
                  className="mt-3 max-w-2xl min-h-[3.5rem] text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveTripDraft}
                disabled={savingDraft}
                className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingDraft ? "Saving Draft..." : "Save Full Trip Draft"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white/92 p-5 dark:bg-slate-900/92">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Total budget
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                  {formatCurrency(planResult.budget_min)} - {formatCurrency(planResult.budget_max)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/92 p-5 dark:bg-slate-900/92">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Average per traveler
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                  {formatCurrency(averagePerTraveler)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/92 p-5 dark:bg-slate-900/92">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                  Route
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                  {planForm.origin || "Flexible"} to {planForm.destination || "Not set"}
                </p>
              </div>
            </div>

            {draftError ? (
              <div className="mt-6 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                {draftError}
              </div>
            ) : null}
          </section>
        ) : null}

        {tripRecord ? (
          <div className="mt-8">
            <TripResultsPanel tripRecord={tripRecord} />
          </div>
        ) : null}

        <div className="mt-8">
          <PopularDestinationsStrip onDestinationSelect={applyDestinationSuggestion} />
        </div>
        <LiveInsightsPanel />
      </main>

      <TravelAssistantWidget
        page="trip-planner"
        initialMode="planner"
        tripPlanForm={planForm}
        tripPlanResult={planResult}
      />
    </div>
  );
}
