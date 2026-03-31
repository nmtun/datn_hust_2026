"use client";

import TaskWorkspace from "@/app/components/TaskWorkspace";
import { withAuth } from "@/app/middleware/withAuth";

function DepartmentHeadTaskPage() {
  return <TaskWorkspace roleMode="department_head" />;
}

export default withAuth(DepartmentHeadTaskPage);
