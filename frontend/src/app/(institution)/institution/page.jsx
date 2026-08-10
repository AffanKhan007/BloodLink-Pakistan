"use client";

import InstitutionRouteGuard from "../../../components/InstitutionRouteGuard";
import InstitutionDashboardPage from "../../../views/institution/InstitutionDashboardPage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["approved"]}>
      <InstitutionDashboardPage />
    </InstitutionRouteGuard>
  );
}