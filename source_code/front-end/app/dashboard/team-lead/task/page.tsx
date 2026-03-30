"use client";

import TaskWorkspace from "@/app/components/TaskWorkspace";
import { withAuth } from "@/app/middleware/withAuth";

function TeamLeadTaskPage() {
  return <TaskWorkspace roleMode="team_lead" />;
}

export default withAuth(TeamLeadTaskPage);
