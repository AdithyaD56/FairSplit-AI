import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";

function ParticipationBadge({ level }) {
  const styles = {
    full: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200",
    half: "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200",
    partial: "bg-blue-50 text-blue-700 dark:bg-blue-500/12 dark:text-blue-200",
    cab_only: "bg-aqua-50 text-brand-700 dark:bg-slate-800 dark:text-slate-50",
    drinks_only: "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200",
    none: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
        styles[level] || "bg-slate-100 text-slate-600"
      }`}
    >
      {level.replace("_", " ")}
    </span>
  );
}

function summaryLine(result) {
  const totalPaid = result.participants.reduce(
    (sum, participant) => sum + Number(participant.paid_amount || 0),
    0,
  );
  if (!result.settlements.length && Math.round(totalPaid * 100) === Math.round(result.total_amount * 100)) {
    return "Everyone is already settled. No transfers are needed after balancing paid amounts and fair shares.";
  }
  return "Everyone pays based on interpreted participation, and debts are simplified into minimum transfer transactions.";
}

export default function ResultSummary({ result }) {
  const { user } = useAuth();

  if (!result) return null;

  function displayName(name) {
    return user?.name && name === user.name ? "You" : name;
  }

  function displayPayers(rawValue) {
    return String(rawValue || "")
      .split(",")
      .map((name) => displayName(name.trim()))
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <section className="glass-card rounded-[2rem] p-6 shadow-soft transition duration-300 hover:-translate-y-1">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Interpreted Scenario
            </p>
            <h2 className="gradient-title mt-2 text-3xl font-black tracking-[-0.05em]">
              {formatCurrency(result.total_amount)}
            </h2>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">Paid by {displayPayers(result.payer_name)}</p>
            <p>{formatDate(result.created_at)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {result.participants.map((participant) => (
            <div
              key={`${participant.name}-${participant.level}`}
              className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-white to-aqua-50 px-5 py-4 transition duration-300 hover:translate-x-1 dark:border dark:border-white/8 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/12"
            >
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{displayName(participant.name)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {participant.note || "Participation interpreted"} · weight{" "}
                  {Number(participant.weight || 0).toFixed(2)}x
                </p>
              </div>
              <div className="text-right">
                <ParticipationBadge level={participant.level} />
                <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  Paid {formatCurrency(participant.paid_amount || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-6 shadow-soft transition duration-300 hover:-translate-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Fair Split
        </p>

        <div className="mt-6 space-y-4">
          {result.shares.map((share) => (
            <div
              key={`${share.person}-${share.participation}-${share.amount}`}
              className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-brand-50 via-white to-aqua-50 px-5 py-4 dark:border dark:border-white/8 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/12"
            >
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{displayName(share.person)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {share.note || "Calculated share"} · {Number(share.weight || 0).toFixed(2)}x
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ParticipationBadge level={share.participation} />
                <p className="text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                  {formatCurrency(share.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-6 shadow-soft transition duration-300 hover:-translate-y-1 xl:col-span-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Final Settlement
        </p>

        <div className="mt-6 space-y-4">
          {result.settlements.length ? (
            result.settlements.map((settlement, index) => (
              <div
                key={`${settlement.from_person}-${settlement.to_person}-${index}`}
                className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 via-aqua-50 to-white p-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/12"
              >
                <p className="text-sm uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Transfer</p>
                <p className="mt-3 text-base font-semibold text-slate-700 dark:text-slate-200">
                  <span className="text-slate-900 dark:text-white">{displayName(settlement.from_person)}</span> pays{" "}
                  <span className="text-slate-900 dark:text-white">{displayName(settlement.to_person)}</span>
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-brand-700">
                  {formatCurrency(settlement.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl bg-emerald-50 p-6 text-sm leading-6 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
              No transfers needed. Everyone is already settled.
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-sm font-semibold leading-7 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
          {summaryLine(result)}
        </div>
      </section>
    </div>
  );
}
