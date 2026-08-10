"use client";

import InstitutionRouteGuard from "../../../../components/InstitutionRouteGuard";
import InstitutionMessagesPage from "../../../../views/institution/InstitutionMessagesPage";

export default function Page() {
  return (
    <InstitutionRouteGuard allowedStatuses={["approved"]}>
      <InstitutionMessagesPage />
    </InstitutionRouteGuard>
  );
}