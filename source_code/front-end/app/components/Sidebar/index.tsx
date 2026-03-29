"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Users,
  UserCircle,
  FileText,
  Building2,
  LayoutDashboard,
  CircleQuestionMark,
  ChevronLeft,
  ChevronRight,
  BrainCog,
  GraduationCap,
  UserCog,
  TrendingUp,
  Wallet,
  CalendarDays,
  Star,
} from "lucide-react";

const menuItems = {
  candidate: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  hr: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ của tôi", href: "/dashboard/hr/profile", icon: UserCog },
    { name: "Mô tả công việc", href: "/dashboard/hr/job-description", icon: FileText },
    { name: "Ứng viên", href: "/dashboard/hr/candidate", icon: Users },
    { name: "Nhân viên", href: "/dashboard/hr/employee", icon: UserCircle },
    // { name: "Phòng ban", href: "/dashboard/hr/department", icon: Building2 },
    // { name: "Nhóm", href: "/dashboard/hr/team", icon: Users },
    // { name: "Kỳ đánh giá", href: "/dashboard/hr/performance-period", icon: CalendarDays },
    // { name: "Hiệu suất", href: "/dashboard/hr/performance", icon: Star },
    // { name: "Lương thưởng", href: "/dashboard/hr/compensation", icon: DollarSign },
    // { name: "Dự báo nhân lực", href: "/dashboard/hr/forecast", icon: TrendingUp },
    // { name: "Báo cáo", href: "/dashboard/hr/report", icon: BarChart3 },
    { name: "Tài liệu đào tạo", href: "/dashboard/hr/training-material", icon: BrainCog },
    { name: "Bài kiểm tra", href: "/dashboard/hr/quizzes", icon: CircleQuestionMark },
  ],
  manager: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ của tôi", href: "/dashboard/manager/profile", icon: UserCog },
    { name: "Phòng ban", href: "/dashboard/manager/department", icon: Building2 },
    { name: "Nhóm", href: "/dashboard/manager/team", icon: Users },
    { name: "Kỳ đánh giá", href: "/dashboard/manager/performance-period", icon: CalendarDays },
    { name: "Hiệu suất", href: "/dashboard/manager/performance", icon: Star },
  ],
  employee: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ của tôi", href: "/dashboard/employee/profile", icon: UserCog },
    { name: "Đánh giá hiệu suất", href: "/dashboard/employee/performance", icon: TrendingUp },
    { name: "Lương thưởng", href: "/dashboard/employee/compensation", icon: Wallet },
    { name: "Đào tạo", href: "/dashboard/employee/training", icon: GraduationCap },
  ],
};

const hierarchyMenuItems = {
  department_head: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ của tôi", href: "/dashboard/employee/profile", icon: UserCog },
    { name: "Đánh giá của tôi", href: "/dashboard/employee/performance", icon: TrendingUp },
    { name: "Lương thưởng", href: "/dashboard/employee/compensation", icon: Wallet },
    { name: "Đào tạo", href: "/dashboard/employee/training", icon: GraduationCap },
    { name: "Quản lý nhóm", href: "/dashboard/department-head/team", icon: Users },
    { name: "Đánh giá nhân sự", href: "/dashboard/department-head/performance", icon: Star },
  ],
  team_lead: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hồ sơ của tôi", href: "/dashboard/employee/profile", icon: UserCog },
    { name: "Đánh giá của tôi", href: "/dashboard/employee/performance", icon: TrendingUp },
    { name: "Lương thưởng", href: "/dashboard/employee/compensation", icon: Wallet },
    { name: "Đào tạo", href: "/dashboard/employee/training", icon: GraduationCap },
    { name: "Thành viên nhóm", href: "/dashboard/team-lead/team", icon: Users },
    { name: "Đánh giá thành viên", href: "/dashboard/team-lead/performance", icon: Star },
  ],
};

const roleLabels: Record<string, string> = {
  hr: 'hr',
  manager: 'manager',
  employee: 'employee',
  candidate: 'candidate',
  department_head: 'truong phong',
  team_lead: 'truong nhom',
};

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userMenuItems =
    user?.hierarchy_role && hierarchyMenuItems[user.hierarchy_role as keyof typeof hierarchyMenuItems]
      ? hierarchyMenuItems[user.hierarchy_role as keyof typeof hierarchyMenuItems]
      : menuItems[user?.role as keyof typeof menuItems] || menuItems.employee;

  const roleLabel = user?.hierarchy_role
    ? roleLabels[user.hierarchy_role] || user.hierarchy_role
    : roleLabels[user?.role || 'employee'] || user?.role;

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
                <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}