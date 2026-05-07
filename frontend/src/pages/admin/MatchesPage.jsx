import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

export default function MatchesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    apiRequest("/admin/requests", { token })
      .then(async (requestData) => {
        setRequests(requestData);
        const matchCollections = await Promise.all(
          requestData.map((request) => apiRequest(`/matches/request/${request.id}`, { token }).catch(() => []))
        );
        setMatches(matchCollections.flat());
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading matches" />;
  if (requests.length === 0 || matches.length === 0) return <EmptyState title="No matches yet" description="Create donor-request matches from the blood requests page." />;

  return (
    <div className="stacked-cards">
      {matches.map((match) => (
        <div className="info-card" key={match.id}>
          <div className="list-row">
            <div>
              <strong>{match.donor.user.full_name}</strong>
              <p>Request #{match.request_id}</p>
            </div>
            <StatusBadge value={match.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

