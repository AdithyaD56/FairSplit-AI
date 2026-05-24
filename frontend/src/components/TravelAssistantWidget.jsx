import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import BotGlyph from "./BotGlyph";
import { expenseApi, getApiError } from "../services/api";
import { formatCurrency } from "../utils/formatters";

function buildTripContext(tripPlanForm, tripPlanResult) {
  if (!tripPlanResult || !tripPlanForm?.destination) return null;

  return {
    origin: tripPlanForm.origin || "",
    destination: tripPlanForm.destination || "",
    days: Number(tripPlanForm.days || 0),
    travelers: Number(tripPlanForm.travelers || 0),
    group_type: tripPlanForm.group_type || "",
    budget_min: Number(tripPlanForm.budget_min || 0),
    budget_max: Number(tripPlanForm.budget_max || 0),
    stay_type: tripPlanForm.stay_type || "",
    travel_mode: tripPlanForm.travel_mode || "",
    interests: tripPlanForm.interests || [],
    notes: tripPlanForm.notes || "",
    planning_notes: tripPlanResult?.planning_notes || [],
  };
}

const assistantModes = [
  {
    id: "splitter",
    label: "Split",
    title: "Split Analyst",
    hint: "Settlements only",
    seed: "LedgerPilot",
  },
  {
    id: "planner",
    label: "Plan",
    title: "Trip Planner",
    hint: "Drafts and budgets",
    seed: "RouteScout",
  },
  {
    id: "scout",
    label: "Scout",
    title: "Place Scout",
    hint: "Short destination picks",
    seed: "BudgetBeacon",
  },
];

function starterMessage(mode, page, tripContext) {
  if (mode === "splitter" || page === "settlements") {
    return "Send the bill story in one message. I will keep the reply short and directly tell you who owes whom.";
  }

  if (mode === "planner") {
    if (tripContext?.destination) {
      return `Your ${tripContext.destination} trip context is loaded. I can refine the route, budget, average per person, and weekly schedule, then save it to Trip Drafts.`;
    }
    return "Describe the trip in one message. I will plan it, keep the answer simple, and save the draft when you ask.";
  }

  if (mode === "scout") {
    return "Ask for a small set of travel picks like stays, cafes, transport, or a simple area suggestion. I will answer directly.";
  }

  return "Ask me one thing clearly. I will keep the reply direct.";
}

function MessageBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] whitespace-pre-line rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-sm ${
          isAssistant
            ? "bg-gradient-to-br from-white to-brand-50 text-slate-700 dark:from-slate-900 dark:to-brand-950/30 dark:text-slate-100"
            : "bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function TravelAssistantWidget({
  tripPlanForm,
  tripPlanResult,
  page = "dashboard",
  initialMode = "auto",
}) {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(initialMode);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedTripId, setSavedTripId] = useState(null);
  const messageEndRef = useRef(null);

  const tripContext = buildTripContext(tripPlanForm, tripPlanResult);
  const totalBudget = tripPlanForm?.budget_max || tripPlanForm?.budget_min || 0;
  const perPersonPerDay = totalBudget
    ? totalBudget / Math.max((tripPlanForm?.days || 1) * (tripPlanForm?.travelers || 1), 1)
    : 0;
  const currentMode = useMemo(() => {
    return assistantModes.find((item) => item.id === activeMode) || assistantModes[0];
  }, [activeMode]);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!open) return;
    if (messages.length) return;
    setMessages([{ role: "assistant", content: starterMessage(activeMode, page, tripContext) }]);
  }, [open, messages.length, activeMode, page, tripContext]);

  useEffect(() => {
    if (!open) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, loading]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function primeConversation(nextMode = activeMode, nextDraft = "") {
    setMessages([{ role: "assistant", content: starterMessage(nextMode, page, tripContext) }]);
    setDraft(nextDraft);
    setError("");
    setSavedTripId(null);
  }

  function handleModeChange(nextMode) {
    if (loading || nextMode === activeMode) return;
    setActiveMode(nextMode);
    if (open) {
      primeConversation(nextMode);
    }
  }

  useEffect(() => {
    function handleAssistantModeRequest(event) {
      const nextMode = event.detail?.mode || activeMode;
      const nextDraft = event.detail?.seedPrompt || "";
      setActiveMode(nextMode);
      setOpen(event.detail?.open !== false);
      primeConversation(nextMode, nextDraft);
    }

    window.addEventListener("fairsplit:assistant-mode-request", handleAssistantModeRequest);
    return () => {
      window.removeEventListener("fairsplit:assistant-mode-request", handleAssistantModeRequest);
    };
  }, [activeMode, page, tripContext]);

  async function sendMessage(rawText) {
    const content = rawText.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError("");

    try {
      const data = await expenseApi.chatAssistant({
        page,
        mode: activeMode,
        messages: nextMessages,
        trip_context: tripContext,
      });
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setSavedTripId(data.saved_trip_id || null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(draft);
  }

  const modePills = assistantModes.map((mode) => (
    <button
      key={mode.id}
      type="button"
      onClick={() => handleModeChange(mode.id)}
      className={`rounded-[1.3rem] border px-3 py-2 text-left transition ${
        activeMode === mode.id
          ? "border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-soft dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
          : "border-white/80 bg-white/82 hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="avatar-shell h-10 w-10">
          <img
            src={`https://api.dicebear.com/9.x/bottts/svg?seed=${mode.seed}&backgroundColor=b6e3f4,ffd5dc,ffe58f`}
            alt={mode.title}
            className="h-10 w-10"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">
            {mode.label}
          </p>
          <p className="text-sm font-black tracking-[-0.03em] text-slate-900 dark:text-white">{mode.title}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {mode.hint}
      </p>
    </button>
  ));

  const floatingInsets = {
    bottom: "max(1.25rem, env(safe-area-inset-bottom))",
    right: "max(1.25rem, env(safe-area-inset-right))",
  };

  const widget = open ? (
    <div className="fixed z-[90] w-[min(92vw,24rem)] sm:w-[24rem]" style={floatingInsets}>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close assistant"
        className="fixed inset-0 z-0 bg-transparent"
      />
      <div className="pointer-events-none relative z-10">
        <div className="assistant-glass-panel pointer-events-auto flex max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[2rem]">
          <div className="assistant-glass-header shrink-0 border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="avatar-shell h-12 w-12 text-brand-700">
                  <BotGlyph className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">
                    FairSplit Bot
                  </p>
                  <p className="mt-1 text-base font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                    {currentMode.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/80 bg-white/72 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/72 dark:text-slate-50 dark:hover:bg-slate-800/90"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">{modePills}</div>

            {tripContext && activeMode !== "splitter" ? (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {tripPlanForm.destination} context loaded at about {formatCurrency(perPersonPerDay)} per person per day.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {activeMode === "splitter"
                  ? "Expense mode is active. Ask for a clean settlement answer."
                  : activeMode === "planner"
                    ? "Planner mode is active. I can build and save a trip draft from your prompt."
                    : "Scout mode is active. Ask for a few direct travel suggestions."}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <MessageBubble key={`${message.role}-${index}`} message={message} />
              ))}
              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                    Searching and preparing your answer...
                  </div>
                </div>
              ) : null}
              <div ref={messageEndRef} />
            </div>

            {savedTripId ? (
              <div className="mt-4">
                <Link
                  to={`/trips/${savedTripId}`}
                  className="inline-flex rounded-full bg-gradient-to-r from-brand-50 to-sun-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-0.5 dark:from-slate-800 dark:to-slate-900 dark:text-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800"
                >
                  Open saved trip draft
                </Link>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-[1.5rem] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
                {error}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Ask one thing clearly. I will search and answer directly."
              className="w-full resize-none rounded-[1.5rem] border border-brand-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-inner outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                No clutter. Just the answer.
              </p>
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-soft transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Working..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : (
    <div className="pointer-events-none fixed z-[90]" style={floatingInsets}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (!messages.length) {
            primeConversation(activeMode);
          }
        }}
        className="assistant-launcher pointer-events-auto"
        aria-label="Open FairSplit assistant"
      >
        <BotGlyph className="h-7 w-7" />
      </button>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(widget, document.body) : widget;
}
