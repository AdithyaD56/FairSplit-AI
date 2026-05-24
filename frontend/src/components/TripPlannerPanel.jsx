import { useState } from "react";

import { expenseApi, getApiError } from "../services/api";
import TypedTagline from "./TypedTagline";
import { formatCurrency } from "../utils/formatters";

export const defaultTripPlanForm = {
  origin: "",
  destination: "",
  days: 7,
  travelers: 4,
  group_type: "friends",
  budget_min: 0,
  budget_max: 0,
  stay_type: "budget stay",
  travel_mode: "flight + metro",
  interests: ["food", "sightseeing"],
  notes: "",
};

const samplePrompt =
  "Plan a 7 week budget trip for 4 friends starting from Visakhapatnam, going first to Tokyo and then Dubai. Keep it low-cost, include cheap flights, budget stays, local transport, simple week-by-week planning, and a clear flights, stays, food, visas, and sightseeing budget split. Save the route as a practical multi-city draft.";

export default function TripPlannerPanel({
  planForm,
  setPlanForm,
  planResult,
  setPlanResult,
}) {
  const [plannerPrompt, setPlannerPrompt] = useState("");
  const [promptMeta, setPromptMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [error, setError] = useState("");
  const [promptError, setPromptError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "interests") {
      setPlanForm((current) => ({
        ...current,
        interests: value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8),
      }));
      setPlanResult(null);
      setError("");
      return;
    }

    setPlanForm((current) => ({
      ...current,
      [name]: ["days", "travelers", "budget_min", "budget_max"].includes(name)
        ? Number(value)
        : value,
    }));
    setPlanResult(null);
    setError("");
  }

  async function handlePlan(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await expenseApi.planTripBudget(planForm);
      setPlanResult(response);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePromptPlan(event) {
    event.preventDefault();
    const trimmedPrompt = plannerPrompt.trim();
    if (!trimmedPrompt) {
      setPromptError("Enter a trip prompt first.");
      return;
    }

    setPromptLoading(true);
    setPromptError("");

    try {
      const response = await expenseApi.planTripFromPrompt({ prompt: trimmedPrompt });
      if (!response?.extracted_plan || !response?.plan) {
        throw new Error("The planner could not understand that prompt. Please try a fuller description.");
      }

      setPlanForm({
        ...defaultTripPlanForm,
        ...response.extracted_plan,
        interests: Array.isArray(response.extracted_plan.interests)
          ? response.extracted_plan.interests
          : [...defaultTripPlanForm.interests],
      });
      setPlanResult(response.plan);
      setPromptMeta({
        source: response.source,
        summary: response.summary,
      });
      setError("");
    } catch (err) {
      setPromptError(getApiError(err));
    } finally {
      setPromptLoading(false);
    }
  }

  function resetPlanner() {
    setPlanForm({ ...defaultTripPlanForm });
    setPlanResult(null);
    setPlannerPrompt("");
    setPromptMeta(null);
    setError("");
    setPromptError("");
  }

  return (
    <section
      id="trip-planner-panel"
      className="mt-8 rounded-[2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-berry-600">
            Optional trip pre-planner
          </p>
          <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
            Turn a travel prompt into a supporting budget draft.
          </h2>
          <TypedTagline
            phrases={[
              "Drop in the idea. Pull out the numbers.",
              "Shape the route before the booking rush starts.",
              "Keep the draft flexible until the group says go.",
            ]}
            className="mt-3 max-w-2xl min-h-[3.5rem] text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={resetPlanner}
          className="rounded-full border border-white/85 bg-white/95 px-6 py-3 text-sm font-semibold text-slate-800 shadow-soft transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 dark:hover:bg-slate-800"
        >
          Reset Planner
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handlePromptPlan}
          className="rounded-[1.75rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-sun-50/70 p-6 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/14"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Trip prompt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Paste the whole travel idea here and let the planner extract the details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlannerPrompt(samplePrompt);
                setPromptMeta(null);
                setPromptError("");
              }}
              className="rounded-full border border-white/85 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-800 dark:text-brand-100 dark:hover:bg-slate-700"
            >
              Load Demo Prompt
            </button>
          </div>

          <textarea
            value={plannerPrompt}
            onChange={(event) => setPlannerPrompt(event.target.value)}
            rows={7}
            className="mt-5 w-full resize-none rounded-[1.5rem] border border-white/85 bg-white/95 p-5 text-sm leading-7 text-slate-900 shadow-inner outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
            placeholder="Example: Plan a 5 day Manali trip for 4 friends under 45k with a cozy stay, cafes, one adventure activity, and local sightseeing..."
          />

          {promptError && (
            <div className="mt-4 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
              {promptError}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={promptLoading || !plannerPrompt.trim()}
              className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {promptLoading ? "Understanding Prompt..." : "Generate From Prompt"}
            </button>
            <button
              type="button"
              onClick={() => setPlannerPrompt("")}
            className="rounded-full border border-white/85 bg-white/95 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-800 transition hover:-translate-y-1 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 dark:hover:bg-slate-800"
          >
            Clear Prompt
          </button>
          </div>
        </form>

        <div className="rounded-[1.75rem] border border-white/85 bg-gradient-to-br from-white via-brand-50/85 to-sun-50 p-6 text-slate-900 shadow-soft dark:border-white/12 dark:from-slate-950 dark:via-brand-950/30 dark:to-slate-900/95 dark:text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            Prompt-to-plan output
          </p>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em]">
            Natural language in, editable travel plan out.
          </p>
          <TypedTagline
            phrases={[
              "Let the prompt do the heavy lifting first.",
              "Refine the draft after the route becomes clear.",
              "Tweak the numbers before you save the full trip.",
            ]}
            className="mt-3 min-h-[3.5rem] text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300"
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-white/92 p-4 shadow-soft dark:border dark:border-white/10 dark:bg-slate-900/95">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Starting from
              </p>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{planForm.origin || "Not set"}</p>
            </div>
            <div className="rounded-[1.4rem] bg-white/92 p-4 shadow-soft dark:border dark:border-white/10 dark:bg-slate-900/95">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Current destination
              </p>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{planForm.destination || "Not set"}</p>
            </div>
            <div className="rounded-[1.4rem] bg-white/92 p-4 shadow-soft dark:border dark:border-white/10 dark:bg-slate-900/95">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Budget range
              </p>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                {planForm.budget_min || planForm.budget_max
                  ? `${formatCurrency(planForm.budget_min)} - ${formatCurrency(planForm.budget_max)}`
                  : "Set from prompt or form"}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/92 p-4 shadow-soft dark:border dark:border-white/10 dark:bg-slate-900/95">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Group style
              </p>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{planForm.group_type || "Not set"}</p>
            </div>
          </div>

          {promptMeta ? (
            <div className="mt-6 rounded-[1.4rem] bg-white/92 p-4 shadow-soft dark:border dark:border-white/10 dark:bg-slate-900/95">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 dark:bg-slate-800 dark:text-slate-50">
                  Source {promptMeta.source}
                </span>
                <span className="rounded-full bg-sun-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-coral-600 dark:bg-slate-800 dark:text-slate-50">
                  Editable draft ready
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{promptMeta.summary}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-brand-100 bg-white/72 p-4 text-sm leading-7 text-slate-600 dark:border-white/12 dark:bg-slate-900/55 dark:text-slate-300">
              Your AI summary will appear here after you generate a draft from the prompt.
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handlePlan} className="mt-8 grid gap-4 lg:grid-cols-6">
        <input
          name="origin"
          value={planForm.origin}
          onChange={updateField}
          placeholder="Starting city"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-2"
        />
        <input
          name="destination"
          value={planForm.destination}
          onChange={updateField}
          placeholder="Destination"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-2"
        />
        <input
          name="days"
          value={planForm.days}
          onChange={updateField}
          type="number"
          min="1"
          placeholder="Days"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="travelers"
          value={planForm.travelers}
          onChange={updateField}
          type="number"
          min="1"
          placeholder="Travelers"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="group_type"
          value={planForm.group_type}
          onChange={updateField}
          placeholder="Group type"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="budget_min"
          value={planForm.budget_min}
          onChange={updateField}
          type="number"
          min="0"
          placeholder="Budget min"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="budget_max"
          value={planForm.budget_max}
          onChange={updateField}
          type="number"
          min="0"
          placeholder="Budget max"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        />
        <input
          name="stay_type"
          value={planForm.stay_type}
          onChange={updateField}
          placeholder="Stay type"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-2"
        />
        <input
          name="travel_mode"
          value={planForm.travel_mode}
          onChange={updateField}
          placeholder="Travel mode"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-2"
        />
        <input
          name="interests"
          value={planForm.interests.join(", ")}
          onChange={updateField}
          placeholder="Interests: cafes, food, nightlife"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-2"
        />
        <input
          name="notes"
          value={planForm.notes}
          onChange={updateField}
          placeholder="Other planning notes"
          className="rounded-3xl border border-white/85 bg-white/95 px-5 py-4 text-sm text-slate-900 shadow-inner outline-none focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 lg:col-span-6"
        />
        <button
          type="submit"
          disabled={loading}
          className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 lg:col-span-6"
        >
          {loading ? "Planning..." : "Generate Trip Budget Draft"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
          {error}
        </div>
      )}

      {planResult && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-gradient-to-r from-brand-50 to-aqua-50 p-5 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Origin
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                {planResult.origin || "Not set"}
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-brand-50 to-aqua-50 p-5 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Destination
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                {planResult.destination}
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-aqua-50 to-brand-50 p-5 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Total range
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                {formatCurrency(planResult.budget_min)} - {formatCurrency(planResult.budget_max)}
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-aqua-50 to-amber-50 p-5 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Per person
              </p>
              <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                {formatCurrency(planResult.per_person_min)} - {formatCurrency(planResult.per_person_max)}
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 md:col-span-2 xl:col-span-4 dark:from-slate-800 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Group and interests
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-100">
                {planResult.group_type}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {planResult.interests.length ? planResult.interests.join(", ") : "No interests added"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {planResult.categories.map((item) => (
              <div
                key={item.category}
                className="rounded-[1.5rem] border border-brand-100 bg-white/85 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                    {item.category}
                  </p>
                  <p className="text-sm font-bold text-brand-700 dark:text-slate-50">
                    {formatCurrency(item.min_amount)} - {formatCurrency(item.max_amount)}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-200">{item.tip}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  Per person {formatCurrency(item.per_person_min)} - {formatCurrency(item.per_person_max)}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-emerald-50 p-5 dark:border dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
              Planning notes
            </p>
            <div className="mt-3 space-y-2">
              {planResult.planning_notes.map((note) => (
                <p key={note} className="text-sm leading-7 text-emerald-700 dark:text-slate-100">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
