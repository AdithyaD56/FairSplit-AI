export default function BotGlyph({ className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="14" y="18" width="36" height="30" rx="12" fill="currentColor" />
      <rect x="22" y="10" width="20" height="8" rx="4" fill="currentColor" opacity="0.45" />
      <path
        d="M32 9V4"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="25" cy="30" r="3.5" fill="white" />
      <circle cx="39" cy="30" r="3.5" fill="white" />
      <path
        d="M24 40C27 42.8 37 42.8 40 40"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M14 28L8 24"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 28L56 24"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
