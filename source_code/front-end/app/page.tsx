"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "./auth/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    const user = getCurrentUser();

    switch (user?.hierarchy_role) {
      case "super_admin":
        router.replace("/super-admin/manage-tenant");
        break;

      case "manager":
        router.replace("/dashboard/manager");
        break;

      case "department_head":
        router.replace("/dashboard/department-head");
        break;
      
      case "team_lead":
        router.replace("/dashboard/team-lead");
        break;

      case "hr":
        router.replace("/dashboard/hr");
        break;

      case "tenant_admin":
      case "admin":
        router.replace("/dashboard/admin");
        break;

      default:
        router.replace("/dashboard/employee");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Loading...
    </div>
  );
}