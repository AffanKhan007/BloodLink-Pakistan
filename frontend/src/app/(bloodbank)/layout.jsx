"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function BloodBankLayout({ children }) {
  return <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>{children}</ProtectedRoute>;
}