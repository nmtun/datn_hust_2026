"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Users,
  UserCircle,
  Briefcase,
  FileText,
  Settings,
  Building2,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = {
  candidate: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  hr: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Job Descriptions", href: "/dashboard/hr/job-description", icon: FileText },
    { name: "Candidates", href: "/dashboard/hr/candidates", icon: Users },
  ],
  manager: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  employee: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
};

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const userMenuItems = menuItems[user?.role as keyof typeof menuItems] || menuItems.employee;

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapse?.(collapsed);
  };

  return (
    <div className={`h-screen bg-white shadow-lg fixed left-0 top-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full relative">
        {/* Toggle Button */}
        <button
          onClick={() => handleCollapse(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white rounded-full p-1 border shadow-md hover:bg-gray-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
        
        {/* Logo/Brand */}
        <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <div className="w-10 h-10 relative">
              <Image 
                src="/favicon.ico" 
                alt="TechCom"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-indigo-600">TechCom</h2>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2">
          {userMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${!isCollapsed ? 'space-x-3' : 'justify-center'} px-3 py-2 my-1 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                title={isCollapsed ? item.name : ""}
              >
                <Icon className="min-w-[20px]" />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-2 border-t">
          <div className={`flex items-center ${!isCollapsed ? 'space-x-3' : 'justify-center'} px-3 py-2`}>
            <div 
              className="min-w-[40px] h-10 rounded-full bg-indigo-100 flex items-center justify-center" 
              title={isCollapsed ? user?.full_name : ""}
            >
              <span className="text-indigo-600 font-semibold">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}