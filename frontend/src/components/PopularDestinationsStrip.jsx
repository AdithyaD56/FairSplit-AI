import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { destinationOptions } from "../data/travelOptions";
import PlaceInsightModal from "./PlaceInsightModal";

function askScoutAbout(place) {
  window.dispatchEvent(
    new CustomEvent("fairsplit:assistant-mode-request", {
      detail: {
        mode: "scout",
        open: true,
        seedPrompt: `Give me a short scouting note for ${place.name}. Tell me the best areas to stay, the journey type, and the strongest places to visit without overspending.`,
      },
    }),
  );
}

export default function PopularDestinationsStrip({
  onDestinationSelect,
  limit = destinationOptions.length,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const destinations = destinationOptions.slice(0, limit);

  function handleApply(place) {
    if (onDestinationSelect) {
      onDestinationSelect(place);
      setSelectedPlace(null);
      return;
    }

    navigate(user ? "/trip-planner" : "/auth");
    setSelectedPlace(null);
  }

  return (
    <>
      <section className="rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-soft dark:border-white/12 dark:bg-slate-950/88 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Destination ideas
            </p>
            <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em]">
              Open a place guide only when you want trip help.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-700 dark:text-slate-200">
            The cards stay out of the landing page now. Open one to see the travel fit,
            strongest areas, and the next planner action.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelectedPlace(item)}
              className="interactive-photo-button focus-ring"
            >
              <article className="travel-photo-card h-[300px] transition duration-300 hover:-translate-y-2">
                <span className="floating-action rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em]">
                  Open guide
                </span>
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                <div className="photo-overlay" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/74">
                    {item.country}
                  </p>
                  <p className="mt-3 text-2xl font-black tracking-[-0.05em]">{item.name}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/76">
                    {item.journeyType}
                  </p>
                  <p className="mt-3 max-w-xs text-sm leading-7 text-white/88">{item.vibe}</p>
                </div>
              </article>
            </button>
          ))}
        </div>
      </section>

      <PlaceInsightModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onApply={handleApply}
        onAskScout={(place) => {
          askScoutAbout(place);
          setSelectedPlace(null);
        }}
      />
    </>
  );
}
