"use client";

import InstitutionRouteGuard from "../../../../components/InstitutionRouteGuard";
import InstitutionRejectedPage from "../../../../views/institution/InstitutionRejectedPage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["rejected"]}>
      <InstitutionRejectedPage />
    </InstitutionRouteGuard>
  );
}