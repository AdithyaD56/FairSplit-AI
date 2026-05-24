const crew = [
  {
    name: "Split Analyst",
    role: "Turns messy stories into clear settlements.",
    seed: "LedgerPilot",
    tone: "from-sky-100 via-white to-brand-100",
    mode: "splitter",
    actionLabel: "Open split mode",
  },
  {
    name: "Budget Keeper",
    role: "Guards the budget before the trip starts.",
    seed: "BudgetBeacon",
    tone: "from-amber-50 via-white to-sun-100",
    mode: "planner",
    actionLabel: "Open planner mode",
  },
  {
    name: "Route Scout",
    role: "Finds short travel options and practical stays.",
    seed: "RouteScout",
    tone: "from-rose-50 via-white to-coral-100",
    mode: "scout",
    actionLabel: "Open scout mode",
  },
];

function launchAssistant(mode) {
  window.dispatchEvent(
    new CustomEvent("fairsplit:assistant-mode-request", {
      detail: { mode, open: true },
    }),
  );
}

export default function AssistantAvatarStrip({ onSelect }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {crew.map((member) => (
        <button
          key={member.name}
          type="button"
          onClick={() => {
            if (onSelect) {
              onSelect(member.mode);
              return;
            }
            launchAssistant(member.mode);
          }}
          className={`focus-ring rounded-[2rem] border border-white/85 bg-gradient-to-br ${member.tone} p-6 text-left shadow-soft transition hover:-translate-y-1 dark:border-white/12 dark:from-slate-950/95 dark:via-slate-900 dark:to-slate-900`}
        >
          <div className="flex items-center gap-4">
            <div className="avatar-shell">
              <img
                src={`https://api.dicebear.com/9.x/bottts/svg?seed=${member.seed}&backgroundColor=b6e3f4,c0aede,ffd5dc`}
                alt={member.name}
                className="h-16 w-16"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                AI Avatar
              </p>
              <p className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                {member.name}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{member.role}</p>
          <span className="mt-5 inline-flex rounded-full border border-white/85 bg-white/95 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
            {member.actionLabel}
          </span>
        </button>
      ))}
    </section>
  );
}
