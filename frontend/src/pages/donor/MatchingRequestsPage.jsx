import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";

export default function MatchingRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiRequest("/donors/matching-requests", { token })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading matching requests" />;
  if (requests.length === 0) {
    return <EmptyState title="No matching requests" description="When approved requests fit your profile, they will appear here." />;
  }

  return (
    <div className="card-list">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} footer={`Confirmed donors: ${request.confirmed_donor_count}`} />
      ))}
    </div>
  );
}

