import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { notificationApi } from "../api/reviewApi";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationApi.getAll({ limit: 20 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchUnread();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((p) => p.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, loading, markRead, markAllRead, refresh: fetchUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
