import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/api";
import { formatDate } from "../utils/formatters";

function BellIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M15 17H9m9-4V11a6 6 0 10-12 0v2c0 .83-.337 1.578-.88 2.12L4 16h16l-.12-.88A2.999 2.999 0 0119 13z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 104 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotificationBell({ latestEvent = null }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const items = await notificationApi.getNotifications();
      setNotifications(items);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    loadNotifications();
    const refreshTimer = window.setInterval(loadNotifications, 20000);
    const handleLocalRefresh = () => loadNotifications();
    window.addEventListener("fairsplit-notification-updated", handleLocalRefresh);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("fairsplit-notification-updated", handleLocalRefresh);
    };
  }, [loadNotifications, token]);

  useEffect(() => {
    if (!latestEvent || !user) return;
    if (user.role !== "admin" && latestEvent.user_id !== user.id) return;
    if (latestEvent.type !== "notification.created") return;
    loadNotifications();
  }, [latestEvent, loadNotifications, user]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function markAsRead(notificationId) {
    try {
      const updated = await notificationApi.markRead(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setError("Could not update this notification.");
    }
  }

  async function markAllAsRead() {
    try {
      const updated = await notificationApi.markAllRead();
      setNotifications(updated);
    } catch {
      setError("Could not update notifications.");
    }
  }

  if (!token) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-soft transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-800/95 dark:text-slate-100"
        aria-label="Open notifications"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[3.25rem] z-30 w-[22rem] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/98 shadow-soft dark:border-white/10 dark:bg-slate-950/98">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Notifications
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Trip draft saves and live activity
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-full bg-brand-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700 transition hover:bg-brand-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Loading notifications...</div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${
                    notification.is_read ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {notification.message}
                      </p>
                    </div>
                    {notification.is_read ? null : (
                      <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {formatDate(notification.created_at)}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
                No notifications yet. Save a trip draft to create one.
              </div>
            )}
          </div>

          {error ? (
            <div className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
