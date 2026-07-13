import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/institutions/me", { token })
      .then(setProfile)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading institution access" />;
  if (error) return <EmptyState title="Institution access unavailable" description={error} />;
  if (!profile) return <EmptyState title="Institution profile not found" description="This institution account does not have a verification profile yet." />;
  if (!allowedStatuses.includes(profile.status)) {
    return <Navigate to={routeForStatus(profile.status)} replace />;
  }

  return children;
}
