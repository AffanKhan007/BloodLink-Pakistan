import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { LoadingState } from "../../components/PageState";
import StatCard from "../../components/StatCard";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiRequest("/admin/dashboard", { token }).then(setStats);
  }, [token]);

  if (!stats) return <LoadingState label="Loading admin dashboard" />;

  return (
    <section className="stats-grid">
      <StatCard label="Users" value={stats.total_users} helper="All roles" />
      <StatCard label="Approved donors" value={stats.approved_donors} helper={`${stats.total_donors} total donors`} />
      <StatCard label="Pending requests" value={stats.pending_requests} helper="Needs admin review" />
      <StatCard label="Active matches" value={stats.active_matches} helper="Pending or accepted" />
      <StatCard label="Approved requests" value={stats.approved_requests} helper="Open for coordination" />
      <StatCard label="Pending reports" value={stats.pending_reports} helper="Needs review" />
    </section>
  );
}

