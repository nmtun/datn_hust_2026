"use client";

import { withAuth } from "../middleware/withAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter(); 

  useEffect(() => {
    if (!user) return;

    switch (user.hierarchy_role) {
      case "tenant_admin":
        router.push("/dashboard/admin");
        break;
      case "manager":
        router.push("/dashboard/manager");
        break;
      case "department_head":
        router.push("/dashboard/department-head");
        break;
      case "team_lead":
        router.push("/dashboard/team-lead");
        break;
      case "hr":
        router.push("/dashboard/hr");
        break;
      case "employee":
        router.push("/dashboard/employee");
        break;
      default:
        router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div>
    </div>
  );
}

export default withAuth(Dashboard);