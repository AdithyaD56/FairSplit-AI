function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.2 14.6 2.2 12 2.2A9.8 9.8 0 0 0 2.2 12 9.8 9.8 0 0 0 12 21.8c5.7 0 9.4-4 9.4-9.6 0-.7-.1-1.2-.2-1.8H12Z" />
      <path fill="#4285F4" d="M3.3 7.4l3.2 2.3C7.4 7.7 9.5 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.2 14.6 2.2 12 2.2 8.2 2.2 4.9 4.3 3.3 7.4Z" />
      <path fill="#FBBC05" d="M12 21.8c2.6 0 4.7-.9 6.3-2.5l-3-2.4c-.8.6-1.9 1.1-3.3 1.1-4 0-5.2-2.6-5.5-3.8l-3.2 2.4c1.6 3.2 4.9 5.2 8.7 5.2Z" />
      <path fill="#34A853" d="M6.5 14.2A6 6 0 0 1 6 12c0-.8.2-1.5.4-2.2L3.3 7.4A9.7 9.7 0 0 0 2.2 12c0 1.6.4 3.2 1.1 4.6l3.2-2.4Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2.2A9.8 9.8 0 0 0 8.9 21.3c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.8.1-.6.3-1 .6-1.2-2.3-.3-4.7-1.1-4.7-5A4 4 0 0 1 6.5 8a3.7 3.7 0 0 1 .1-2.7s.8-.2 2.8 1A9.5 9.5 0 0 1 12 6c.9 0 1.7.1 2.6.4 2-1.3 2.8-1 2.8-1 .4.9.3 2 .1 2.7a4 4 0 0 1 1.1 2.8c0 3.8-2.4 4.6-4.7 4.9.3.3.7.8.7 1.7v2.4c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.2Z" />
    </svg>
  );
}

const providers = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "github", label: "Continue with GitHub", icon: GitHubIcon },
];

export default function AuthProviderButtons({
  onSelect,
  activeProvider,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {providers.map((provider) => {
        const Icon = provider.icon;
        const isActive = activeProvider === provider.id;
        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelect?.(provider.id)}
            disabled={Boolean(activeProvider)}
            className={`flex w-full items-center justify-center gap-3 rounded-[1.3rem] border px-4 py-4 text-sm font-semibold shadow-soft transition dark:text-slate-50 ${
              isActive
                ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-300 dark:bg-brand-400/14 dark:text-brand-100"
                : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 dark:border-white/12 dark:bg-slate-950/95"
            } ${activeProvider && !isActive ? "cursor-not-allowed opacity-65" : ""}`}
          >
            <Icon />
            <span>
              {isActive
                ? `Opening ${provider.label.replace("Continue with ", "")}...`
                : provider.label.replace("Continue with ", "")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
