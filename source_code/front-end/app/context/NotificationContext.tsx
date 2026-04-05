"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { notificationApi, NotificationItem } from "../api/notificationApi";
import { showToast } from "../utils/toast";
import { useAuth } from "./AuthContext";
import { getToken } from "../auth/lib/auth";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getSocketServerUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";

  try {
    const parsedUrl = new URL(apiUrl);
    return parsedUrl.origin;
  } catch {
    return apiUrl.replace(/\/api\/?$/, "");
  }
};

const SOCKET_SERVER_URL = getSocketServerUrl();

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const syncUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const response = await notificationApi.getUnreadCount();
      if (!response.error) {
        setUnreadCount(Number(response.unread_count || 0));
      }
    } catch (error) {
      console.error("Failed to sync unread count:", error);
    }
  }, [isLoggedIn]);

  const syncNotificationToState = useCallback((incoming: NotificationItem) => {
    setNotifications((prev) => {
      const next = [incoming, ...prev.filter((item) => item.notification_id !== incoming.notification_id)];

      return next.slice(0, 30);
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) return;

    setLoading(true);
    try {
      const response = await notificationApi.getAll({ limit: 100, offset: 0 });
      if (!response.error) {
        setNotifications(response.notifications || []);
        setUnreadCount(Number(response.unread_count || 0));
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      setNotifications((prev) =>
        prev.map((item) => {
          if (item.notification_id !== notificationId || item.is_read) return item;
          return {
            ...item,
            is_read: true,
            read_at: new Date().toISOString(),
          };
        })
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

      try {
        await notificationApi.markAsRead(notificationId);
        await syncUnreadCount();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        await refreshNotifications();
      }
    },
    [refreshNotifications, syncUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((item) => !item.is_read);
    if (!hasUnread) return;

    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || readAt })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
      await syncUnreadCount();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      await refreshNotifications();
    }
  }, [notifications, refreshNotifications, syncUnreadCount]);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();
  }, [isLoggedIn, user, refreshNotifications]);

  useEffect(() => {
    const token = getToken();

    if (!isLoggedIn || !token || !SOCKET_SERVER_URL) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      void refreshNotifications();
    });

    socket.on("notification:new", ({ notification }: { notification: NotificationItem }) => {
      syncNotificationToState(notification);
      void syncUnreadCount();
      showToast.success("Bạn có thông báo mới");
    });

    socket.on(
      "notification:updated",
      (payload: { notification_id: number; is_read: boolean; read_at?: string }) => {
        setNotifications((prev) =>
          prev.map((item) => {
            if (item.notification_id !== payload.notification_id) return item;

            if (!item.is_read && payload.is_read) {
              setUnreadCount((count) => (count > 0 ? count - 1 : 0));
            }

            return {
              ...item,
              is_read: payload.is_read,
              read_at: payload.read_at || item.read_at,
            };
          })
        );
      }
    );

    socket.on("notification:mark_all_read", () => {
      const readAt = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || readAt })));
      setUnreadCount(0);
    });

    socket.on("connect_error", (error) => {
      console.error("Notification socket connection error:", error.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, refreshNotifications, syncNotificationToState, syncUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
