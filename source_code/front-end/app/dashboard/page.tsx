"use client";

import { withAuth } from "../middleware/withAuth";

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}

export default withAuth(Dashboard);