"use client";

import { Suspense } from "react";

import BloodRequestsPage from "../../../../views/admin/BloodRequestsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BloodRequestsPage />
    </Suspense>
  );
}