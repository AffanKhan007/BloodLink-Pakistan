"use client";

import InstitutionRouteGuard from "../../../../components/InstitutionRouteGuard";
import InstitutionVerificationPendingPage from "../../../../views/institution/InstitutionVerificationPendingPage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["pending"]}>
      <InstitutionVerificationPendingPage />
    </InstitutionRouteGuard>
  );
}