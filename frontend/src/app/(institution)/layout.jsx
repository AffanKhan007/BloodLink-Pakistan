"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function InstitutionLayout({ children }) {
  return <ProtectedRoute roles={["institution_donor"]}>{children}</ProtectedRoute>;
}