"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, LoadingState } from "./PageState";

function routeForStatus(status) {
  if (status === "pending") return "/institution/verification-pending";
  if (status === "rejected") return "/institution/rejected";
  if (status === "suspended") return "/institution/suspended";
  return "/institution";
}

export default function InstitutionRouteGuard({ children, allowedStatuses }) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/institutions/me", { token })
      .then(setProfile)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (loading || error || !profile) return;
    if (!allowedStatuses.includes(profile.status)) {
      router.replace(routeForStatus(profile.status));
    }
  }, [loading, error, profile, allowedStatuses, router]);

  if (loading) return <LoadingState label="Loading institution access" />;
  if (error) return <EmptyState title="Institution access unavailable" description={error} />;
  if (!profile) return <EmptyState title="Institution profile not found" description="This institution account does not have a verification profile yet." />;
  if (!allowedStatuses.includes(profile.status)) {
    return null;
  }

  return children;
}
