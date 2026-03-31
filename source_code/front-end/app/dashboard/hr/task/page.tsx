"use client";

import TaskWorkspace from "@/app/components/TaskWorkspace";
import { withAuth } from "@/app/middleware/withAuth";

function HrTaskPage() {
  return <TaskWorkspace roleMode="employee" />;
}

export default withAuth(HrTaskPage);
