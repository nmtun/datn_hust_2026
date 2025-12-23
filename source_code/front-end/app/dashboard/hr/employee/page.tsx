/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { withAuth } from "@/app/middleware/withAuth";
import React from 'react';

function EmployeePage() {
  return (
    <div>
      <h1>Employee Management Page</h1>
      {/* Employee dashboard content goes here */}
    </div>
  );
}

export default withAuth(EmployeePage);