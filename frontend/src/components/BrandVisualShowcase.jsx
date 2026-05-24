import { useMemo, useState } from "react";

import { allCountryNames, getCountryBookingConfig } from "../data/travelOptions";

const sceneImages = {
  flights:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=90",
  trains:
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=90",
  cabs:
    "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1400&q=90",
  stays:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90",
};

function ExternalArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M8 16 16 8M10 8h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScenicTile({ image, title, note, action }) {
  return (
    <article className="travel-photo-card h-[220px]">
      <img src={image} alt={title} className="h-full w-full object-cover" />
      <div className="photo-overlay" />
      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
        <a
          href={action.url}
          target="_blank"
          rel="noreferrer"
          className="floating-action focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em]"
        >
          <span>{action.label}</span>
          <ExternalArrow />
        </a>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/74">
            {action.title}
          </p>
          <p className="mt-3 max-w-xs text-2xl font-black tracking-[-0.05em]">{title}</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-white/88">{note}</p>
        </div>
      </div>
    </article>
  );
}

export default function BrandVisualShowcase({ compact = false, initialCountry = "India" }) {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const bookingConfig = useMemo(
    () => getCountryBookingConfig(selectedCountry),
    [selectedCountry],
  );

  const tiles = [
    {
      key: "flights",
      image: sceneImages.flights,
      title: "Build the route before the group spends.",
      note: "Flight discovery first, then bring the budget back into FairSplit.",
      action: bookingConfig.providers.flights,
    },
    {
      key: "trains",
      image: sceneImages.trains,
      title: "Keep regional travel practical and connected.",
      note: "Use rail or local transit links when flights are not the smartest move.",
      action: bookingConfig.providers.trains,
    },
    {
      key: "cabs",
      image: sceneImages.cabs,
      title: "Handle airport hops and local rides cleanly.",
      note: "Useful when the group needs a trusted ride option after booking the route.",
      action: bookingConfig.providers.cabs,
    },
    {
      key: "stays",
      image: sceneImages.stays,
      title: "Choose the stay type that fits the group budget.",
      note: "Hotel or hostel search without cluttering the planner itself.",
      action: bookingConfig.providers.stays,
    },
  ];

  return (
    <section
      className={`relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/92 p-5 text-slate-900 shadow-soft dark:border-white/12 dark:bg-slate-950/88 dark:text-white ${
        compact ? "min-h-[460px]" : "min-h-[540px]"
      }`}
    >
      <div className="hero-grid absolute inset-0 opacity-60" />
      <div className="absolute left-10 top-8 h-32 w-32 rounded-full bg-brand-500/16 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-coral-500/14 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Travel booking hub
            </p>
            <h2 className="gradient-title mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Country-aware links without crowding the planner.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
              Choose a country, then use the floating buttons on each image for flights,
              trains, cabs, and stays. The planner stays focused while booking links stay easy
              to reach.
            </p>
          </div>

          <div className="glass-card rounded-[1.7rem] px-5 py-4 shadow-soft dark:bg-slate-900/92">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
              Country selection
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Select country</span>
              <select
                value={selectedCountry}
                onChange={(event) => setSelectedCountry(event.target.value)}
                className="focus-ring w-full rounded-[1.25rem] border border-white/85 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-soft outline-none transition focus:border-brand-500 dark:border-white/12 dark:bg-slate-900/95 dark:text-slate-50"
              >
                {allCountryNames.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-700 dark:text-slate-200">
              {bookingConfig.description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {tiles.map((tile) => (
            <ScenicTile
              key={tile.key}
              image={tile.image}
              title={tile.title}
              note={tile.note}
              action={tile.action}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
