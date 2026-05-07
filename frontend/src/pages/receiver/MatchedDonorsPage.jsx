import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

export default function MatchedDonorsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    apiRequest("/requests", { token })
      .then((data) => {
        setRequests(data);
        if (data[0]) setSelectedRequestId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedRequestId) {
      setMatches([]);
      return;
    }
    apiRequest(`/matches/request/${selectedRequestId}`, { token }).then(setMatches);
  }, [selectedRequestId, token]);

  if (loading) return <LoadingState label="Loading matched donors" />;
  if (requests.length === 0) return <EmptyState title="No requests available" description="Create a request first to see donor assignments." />;

  return (
    <div className="page-stack">
      <div className="content-card">
        <label>
          Select request
          <select value={selectedRequestId || ""} onChange={(event) => setSelectedRequestId(Number(event.target.value))}>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                #{request.id} - {request.patient_name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {matches.length === 0 ? (
        <EmptyState title="No donor assignments yet" description="Approved and matched donors will show here when the admin creates them." />
      ) : (
        <div className="stacked-cards">
          {matches.map((match) => (
            <div className="info-card" key={match.id}>
              <div className="list-row">
                <div>
                  <strong>{match.donor.user.full_name}</strong>
                  <p>{match.donor.blood_group} donor in {match.donor.city}</p>
                </div>
                <StatusBadge value={match.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

