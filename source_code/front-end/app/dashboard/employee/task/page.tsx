"use client";

import TaskWorkspace from "@/app/components/TaskWorkspace";
import { withAuth } from "@/app/middleware/withAuth";

function EmployeeTaskPage() {
  return <TaskWorkspace roleMode="employee" />;
}

export default withAuth(EmployeeTaskPage);
