"use client";

import { Bell, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)} />
      <div className={`flex-1 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <header className="bg-white h-16 shadow-sm">
          <div className="h-full px-6 flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <button
                className="p-2 hover:bg-gray-100 rounded-full relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
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