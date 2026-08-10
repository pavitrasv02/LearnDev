import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, BookOpen, Award, MessageSquare, Megaphone, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ── Icon per notification type ────────────────────────────────────────────
function NotifIcon({ type }) {
  const map = {
    course_update:   { icon: BookOpen,    bg: "bg-brand-100 dark:bg-brand-900/30",   color: "text-brand-500" },
    certificate:     { icon: Award,       bg: "bg-green-100 dark:bg-green-900/30",   color: "text-green-500" },
    complaint_update:{ icon: MessageSquare, bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-500" },
    announcement:    { icon: Megaphone,   bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-500" },
    recommendation:  { icon: Sparkles,   bg: "bg-pink-100 dark:bg-pink-900/30",     color: "text-pink-500" },
  };
  const { icon: Icon, bg, color } = map[type] || map.announcement;
  return (
    <div className={`p-2 rounded-xl ${bg} shrink-0`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Poll unread count every 60s
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await api.get("/notifications", { params: { limit: 1 } });
        setUnread(res.data.unreadCount || 0);
      } catch { /* silently fail */ }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [user]);

  const openPanel = async () => {
    if (!user) return;
    setOpen((v) => !v);
    if (loading || notifications.length > 0) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit: 20 } });
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silently fail */ }
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* silently fail */ }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        className="relative p-2 rounded-lg glass hover:bg-white/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute right-0 top-12 w-80 sm:w-96 glass-card shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-sm">Notifications {unread > 0 && <span className="ml-1 badge badge-blue">{unread} new</span>}</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-3/4" />
                        <div className="skeleton h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800/50 ${!n.read ? "bg-brand-50/50 dark:bg-brand-900/10" : ""}`}
                    onClick={() => markOne(n._id)}
                  >
                    <NotifIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
