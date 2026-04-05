"use client";

import { Bell, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { NotificationProvider, useNotifications } from "../context/NotificationContext";
import { useEffect, useMemo, useRef, useState } from "react";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
};

function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, refreshNotifications } = useNotifications();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setIsNotificationOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const recentNotifications = useMemo(() => notifications, [notifications]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)} />
      <div className={`flex-1 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 h-16 shadow-sm">
          <div className="h-full px-6 flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <div className="relative" ref={panelRef}>
                <button
                  onClick={() => {
                    const nextOpen = !isNotificationOpen;
                    setIsNotificationOpen(nextOpen);
                    if (nextOpen) {
                      void refreshNotifications();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Đánh dấu đã đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {loading && recentNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">Đang tải thông báo...</div>
                      ) : recentNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500">Chưa có thông báo nào.</div>
                      ) : (
                        recentNotifications.map((item) => (
                          <button
                            key={item.notification_id}
                            onClick={() => {
                              if (!item.is_read) {
                                markAsRead(item.notification_id);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${item.is_read ? 'bg-white' : 'bg-indigo-50/40'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.message}</p>
                                {item.actor?.full_name && (
                                  <p className="text-[11px] text-gray-500 mt-1">Từ: {item.actor.full_name}</p>
                                )}
                                <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(item.created_at)}</p>
                              </div>
                              {!item.is_read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-8 w-[1px] bg-gray-200"></div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <DashboardShell>{children}</DashboardShell>
    </NotificationProvider>
  );
}