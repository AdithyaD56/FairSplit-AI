import { useState } from "react";
import { Link } from "react-router-dom";

import { expenseApi, getApiError } from "../services/api";
import ReceiptScannerPanel from "./ReceiptScannerPanel";
import ResultSummary from "./ResultSummary";

const sampleScenario =
  "We went on a weekend trip, total expense was 8650. Me and Arjun stayed full time, Rahul joined only 2 days, Sneha did not come for food but shared the cab, I paid 5000 and Arjun paid the rest. Can you split this properly and tell who owes how much?";

const quickHelpers = [
  "I paid the full bill.",
  "Count me and Arun full, Ravi half.",
  "Karthik didn't eat, so none.",
  "Rahul paid by UPI.",
];

const surprisePrompts = [
  "Beach trip cost 12,400. I paid 7000 and Neha paid rest. Me and Neha stayed all 4 days, Kiran joined 2 days only, Dev only shared the cab to the station.",
  "Movie snacks total 760. I paid. Me and Noor had popcorn and drinks full, Arjun only had a drink half, Lina skipped snacks.",
  "Road trip toll and snacks came to 1890. Kunal paid. Kunal and I used everything full, Mahi joined halfway half, Tara didn't join.",
];

export default function ExpenseAnalyzerPanel() {
  const [scenario, setScenario] = useState(sampleScenario);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const analysis = await expenseApi.analyzeExpense(scenario);
      setResult(analysis);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function appendHelper(text) {
    setScenario((current) => `${current.trim()} ${text}`.trim());
  }

  function surpriseMe() {
    const index = Math.floor(Math.random() * surprisePrompts.length);
    setScenario(surprisePrompts[index]);
    setResult(null);
    setError("");
  }

  function clearScenario() {
    setScenario("");
    setResult(null);
    setError("");
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser. Please type the scenario instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    setError("");

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setScenario((current) => `${current.trim()} ${transcript}`.trim());
      }
    };

    recognition.onerror = () => {
      setError("Voice capture failed. Please try again or type the scenario manually.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }

  return (
    <section className="rounded-[2rem] border border-white/85 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Fair split studio
          </p>
          <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
            Split shared costs between friends.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Paste the messy real-world story exactly the way your group says it. FairSplit
            AI handles partial joins, half shares, skipped meals, cab-only participation,
            and multiple payers without forcing you into a spreadsheet.
          </p>
        </div>
        <Link
          to="/history"
            className="inline-flex rounded-full border border-white/85 bg-white/95 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur-xl transition hover:-translate-y-1 hover:border-brand-200 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
        >
          View Split History
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          "Understands full, half, partial, and cab-only participation.",
          "Works with mixed payments and people who paid the rest.",
          "Keeps the result readable enough to send back to the group chat.",
        ].map((item, index) => (
          <article
            key={item}
            className={`rounded-[1.6rem] px-5 py-5 shadow-soft ${
              index === 0
                ? "border border-white/75 bg-gradient-to-br from-brand-50 to-white dark:border-white/12 dark:from-slate-900 dark:to-slate-950"
                : index === 1
                  ? "border border-white/75 bg-gradient-to-br from-sun-50 to-white dark:border-white/12 dark:from-slate-900 dark:to-slate-950"
                  : "border border-white/75 bg-gradient-to-br from-coral-50 to-white dark:border-white/12 dark:from-slate-900 dark:to-slate-950"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              FairSplit signal
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700 dark:text-slate-100">{item}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {quickHelpers.map((helper) => (
          <button
            key={helper}
            type="button"
            onClick={() => appendHelper(helper)}
            className="rounded-full border border-brand-100 bg-white/92 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-1 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
          >
            + {helper}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ReceiptScannerPanel
          onExtractText={(text) => {
            setScenario((current) => `${current.trim()}${text}`.trim());
            setResult(null);
            setError("");
          }}
        />
      </div>

      <form onSubmit={handleAnalyze} className="mt-8 space-y-5">
        <div className="relative">
          <div className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-brand-100 to-aqua-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-50">
            {scenario.length} chars
          </div>
          <textarea
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            rows={8}
            className="w-full resize-none rounded-[1.75rem] border border-white/85 bg-white/95 p-5 pr-28 text-sm leading-7 text-slate-900 shadow-inner outline-none backdrop-blur-xl transition focus:border-brand-500 focus:bg-white dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50 dark:focus:bg-slate-950"
            placeholder="Type a real-life expense scenario in your own tone..."
          />
        </div>

        {error && (
          <div className="rounded-3xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <button
            type="submit"
            disabled={loading}
            className="shimmer-button rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          >
            {loading ? "Analyzing..." : "Analyze Expense"}
          </button>
          <button
            type="button"
            onClick={startVoiceInput}
            className={`rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-soft transition hover:scale-[1.02] ${
              listening
                ? "animate-pulseGlow bg-gradient-to-r from-rose-500 to-orange-500"
                : "bg-gradient-to-r from-aqua-500 to-brand-600"
            }`}
          >
            {listening ? "Listening..." : "Voice Input"}
          </button>
          <button
            type="button"
            onClick={surpriseMe}
            className="rounded-full bg-gradient-to-r from-coral-500 to-sun-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-soft transition hover:scale-[1.02]"
          >
            Surprise Me
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setScenario(sampleScenario)}
            className="flex-1 rounded-full bg-brand-50 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-brand-700 transition hover:-translate-y-1 dark:bg-slate-800 dark:text-brand-100"
          >
            Use Sample
          </button>
          <button
            type="button"
            onClick={clearScenario}
            className="flex-1 rounded-full border border-slate-200 bg-white/92 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-800 backdrop-blur-xl transition hover:-translate-y-1 hover:border-rose-200 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
          >
            Clear Draft
          </button>
        </div>
      </form>

      <div className="mt-8">
        <ResultSummary result={result} />
      </div>
    </section>
  );
}
