"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function BloodBankAdminLayout({ children }) {
  return <ProtectedRoute roles={["blood_bank_admin"]}>{children}</ProtectedRoute>;
}