"use client";

import InstitutionRouteGuard from "../../../../components/InstitutionRouteGuard";
import InstitutionProfilePage from "../../../../views/institution/InstitutionProfilePage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["approved"]}>
      <InstitutionProfilePage />
    </InstitutionRouteGuard>
  );
}