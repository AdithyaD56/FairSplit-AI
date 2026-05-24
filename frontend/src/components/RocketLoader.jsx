function RocketIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <g transform="translate(60 60)">
        <path
          d="M0-36c18 4 30 18 34 36-8 4-17 7-27 8l-7 12-7-12c-10-1-19-4-27-8 4-18 16-32 34-36Z"
          fill="url(#rocketBody)"
        />
        <path d="M0-32c8 0 14 6 14 14S8-4 0-4s-14-6-14-14 6-14 14-14Z" fill="#f7fbff" opacity="0.92" />
        <path d="M-8 11l-10 18 14-4 4-14M8 11l10 18-14-4-4-14" fill="#ffb46a" />
        <path d="M0 12c6 8 9 18 7 28-4-2-7-5-10-8-3 3-6 6-10 8-2-10 1-20 7-28h6Z" fill="#ff6d43" />
        <defs>
          <linearGradient id="rocketBody" x1="-28" y1="-30" x2="28" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e9f9ff" />
            <stop offset="0.52" stopColor="#88def0" />
            <stop offset="1" stopColor="#ff9362" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
}

export default function RocketLoader({ title = "Loading", subtitle = "Preparing the next screen..." }) {
  return (
    <div className="rocket-loader-shell">
      <div className="rocket-loader-card">
        <div className="rocket-loader-stage">
          <div className="rocket-loader-glow" />
          <div className="rocket-loader-trail" />
          <div className="rocket-loader-rocket">
            <RocketIcon />
          </div>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 dark:text-slate-50">
          FairSplit AI
        </p>
        <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
          {title}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
