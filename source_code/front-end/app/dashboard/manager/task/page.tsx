"use client";

import TaskWorkspace from "@/app/components/TaskWorkspace";
import { withAuth } from "@/app/middleware/withAuth";

function ManagerTaskPage() {
  return <TaskWorkspace roleMode="manager" />;
}

export default withAuth(ManagerTaskPage);
