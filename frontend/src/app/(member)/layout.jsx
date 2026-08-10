"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function MemberLayout({ children }) {
  return <ProtectedRoute roles={["member"]}>{children}</ProtectedRoute>;
}