import { useEffect, useMemo, useState } from "react";

function TypewriterText({ text, speed = 22 }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    if (!text) return undefined;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return <span className="type-cursor">{visibleText}</span>;
}

export default function PlaceInsightModal({
  place,
  onClose,
  onApply,
  onAskScout,
}) {
  const typedGreeting = useMemo(() => {
    if (!place) return "";
    return `${place.greeting} ${place.name} fits ${place.journeyType.toLowerCase()} travel really well.`;
  }, [place]);

  useEffect(() => {
    if (!place) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [place, onClose]);

  if (!place) return null;

  return (
    <div className="place-dialog-backdrop" onClick={onClose}>
      <div
        className="place-dialog-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-dialog-title"
      >
        <div className="grid lg:grid-cols-[1fr_1.02fr]">
          <div className="place-dialog-hero">
            <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
            <div className="photo-overlay" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                {place.country}
              </p>
              <h3 id="place-dialog-title" className="mt-3 text-4xl font-black tracking-[-0.06em]">
                {place.name}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/88">
                {place.vibe}
              </p>
            </div>
          </div>

          <div className="bg-white/95 p-6 dark:bg-slate-950/96 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                  Planner insight
                </p>
                <div className="place-dialog-copy mt-3 text-xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                  <TypewriterText text={typedGreeting} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-full border border-white/85 bg-white/95 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="chip-surface rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                  Journey type
                </p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                  {place.journeyType}
                </p>
              </div>
              <div className="chip-surface rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                  Best season
                </p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                  {place.bestTime}
                </p>
              </div>
              <div className="chip-surface rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                  Budget feel
                </p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                  {place.budgetRange}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-gradient-to-br from-brand-50 via-white to-sun-50 p-5 dark:from-brand-950/30 dark:via-slate-950 dark:to-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Best nearby picks
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {place.bestPlaces.map((item) => (
                  <span
                    key={item}
                    className="chip-surface rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {place.quickNote}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Stay focus
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {place.stayFocus}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4 dark:bg-slate-900/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Food and local travel
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {place.foodAndTransport}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onApply?.(place)}
                className="shimmer-button focus-ring rounded-full bg-gradient-to-r from-brand-600 via-coral-500 to-sun-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.02]"
              >
                Use This Destination
              </button>
              <button
                type="button"
                onClick={() => onAskScout?.(place)}
                className="focus-ring rounded-full border border-white/85 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-100"
              >
                Ask Trip Scout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
