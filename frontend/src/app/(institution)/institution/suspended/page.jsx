"use client";

import InstitutionRouteGuard from "../../../../components/InstitutionRouteGuard";
import InstitutionSuspendedPage from "../../../../views/institution/InstitutionSuspendedPage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["suspended"]}>
      <InstitutionSuspendedPage />
    </InstitutionRouteGuard>
  );
}