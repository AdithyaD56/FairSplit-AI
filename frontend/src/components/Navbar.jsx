import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../hooks/useLiveEvents";

const userLinks = [
  { to: "/dashboard", label: "Bill Splitter" },
  { to: "/trip-planner", label: "Travel Workspace" },
  { to: "/reviews", label: "Reviews" },
  { to: "/trips", label: "Trip Drafts" },
  { to: "/developers", label: "Developers" },
];

const adminLinks = [
  { to: "/admin", label: "Admin" },
  { to: "/developers", label: "Developers" },
];

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { latestEvent } = useLiveEvents(token);
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === "admin" ? adminLinks : userLinks;
  const activeIndex = Math.max(
    links.findIndex(
      (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    ),
    0,
  );

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/75 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-[#060d17]/96">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="gradient-title text-2xl font-black tracking-[-0.04em]">
          FairSplit <span className="text-brand-600">AI</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          <Link
            to="/"
            className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-800/95 dark:text-slate-100 dark:hover:bg-slate-700/95"
          >
            Back to Homescreen
          </Link>

          <nav
            className="nav-mode-shell hidden sm:grid"
            style={{ "--nav-count": links.length, "--nav-index": activeIndex }}
          >
            <span className="nav-mode-thumb" aria-hidden="true" />
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative z-10 rounded-full px-4 py-2 text-center text-sm font-semibold transition duration-300 ${
                    isActive
                      ? "text-brand-800 dark:text-brand-50"
                      : "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NotificationBell latestEvent={latestEvent} />
          <ThemeToggle compact />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{user?.role}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shimmer-button rounded-full bg-gradient-to-r from-brand-700 via-coral-500 to-sun-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      <nav
        className="nav-mode-shell grid border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:hidden"
        style={{ "--nav-count": links.length, "--nav-index": activeIndex }}
      >
        <span className="nav-mode-thumb" aria-hidden="true" />
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative z-10 rounded-full px-3 py-2 text-center text-sm font-semibold transition duration-300 ${
                isActive
                  ? "text-brand-800 dark:text-brand-50"
                  : "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
