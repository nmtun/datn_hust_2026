"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  UserCircle,
  Briefcase,
  FileText,
  Settings,
  Building2,
  LayoutDashboard,
} from "lucide-react";

const menuItems = {
  candidate: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  hr: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Job Descriptions", href: "/dashboard/hr/job-description", icon: FileText },
  ],
  manager: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  employee: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const userMenuItems = menuItems[user?.role as keyof typeof menuItems] || menuItems.employee;

  return (
    <div className="h-screen w-64 bg-white shadow-lg fixed left-0 top-0">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-indigo-600">TechCom</h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-2">
          {userMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}