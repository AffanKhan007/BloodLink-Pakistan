"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../auth/AuthContext";
import { LoadingState } from "./PageState";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (roles && !roles.includes(user?.role)) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, roles, router, user?.role]);

  if (isLoading) {
    return <LoadingState label="Loading your workspace" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && !roles.includes(user?.role)) {
    return null;
  }

  return children;
}
