export default function StatCard({ label, value, caption }) {
  return (
    <div className="glass-card rounded-3xl p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-neon">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="gradient-title mt-4 text-4xl font-black tracking-[-0.05em]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{caption}</p>
    </div>
  );
}
