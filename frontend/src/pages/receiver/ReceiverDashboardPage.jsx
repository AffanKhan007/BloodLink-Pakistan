import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import StatCard from "../../components/StatCard";

export default function ReceiverDashboardPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiRequest("/requests", { token })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading receiver dashboard" />;

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Total requests" value={requests.length} helper="Owned by you" />
        <StatCard label="Approved or matched" value={requests.filter((item) => ["approved", "matched"].includes(item.status)).length} helper="Admin-reviewed" />
        <StatCard label="Fulfilled" value={requests.filter((item) => item.status === "fulfilled").length} helper="Closed successfully" />
        <StatCard label="Confirmed donors" value={requests.reduce((sum, item) => sum + item.confirmed_donor_count, 0)} helper="Across all requests" />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2>My requests</h2>
          </div>
        </div>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Create a blood request to start the admin review and matching flow." />
        ) : (
          <div className="card-list">
            {requests.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} footer={`${request.confirmed_donor_count} confirmed donors`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

