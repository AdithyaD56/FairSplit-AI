import { formatCurrency, formatDate } from "../utils/formatters";

export default function HistoryCard({ record }) {
  return (
    <article className="glass-card rounded-[2rem] p-6 shadow-soft transition duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            {formatDate(record.created_at)}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{record.scenario}</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-r from-brand-50 to-aqua-50 px-5 py-4 text-right dark:from-brand-950/30 dark:to-slate-900/95">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Total</p>
          <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
            {formatCurrency(record.total_amount)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Shares</p>
          {record.shares.map((share) => (
            <div
              key={`${record.id}-${share.person}-${share.participation}`}
              className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm dark:bg-slate-900/70"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-100">{share.person}</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(share.amount)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Settlements
          </p>
          {record.settlements.length ? (
            record.settlements.map((settlement, index) => (
              <div
                key={`${record.id}-${settlement.from_person}-${settlement.to_person}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-50 to-aqua-50 px-4 py-3 text-sm dark:from-brand-950/30 dark:to-slate-900/95"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {settlement.from_person} to {settlement.to_person}
                </span>
                <span className="font-bold text-brand-700">
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
              No pending transfers
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
