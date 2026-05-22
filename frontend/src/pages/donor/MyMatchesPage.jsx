import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

export default function MyMatchesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const loadMatches = async () => {
    const data = await apiRequest("/matches/me", { token });
    setMatches(data);
  };

  useEffect(() => {
    loadMatches().finally(() => setLoading(false));
  }, [token]);

  const updateMatch = async (id, action) => {
    setError("");
    try {
      await apiRequest(`/matches/${id}/${action}`, { method: "PATCH", token });
      await loadMatches();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading my matches" />;
  if (matches.length === 0) return <EmptyState title="No assigned matches" description="Compatible requests will appear here after automatic matching or admin coordination." />;

  return (
    <div className="page-stack">
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      {matches.map((match) => (
        <div className="content-card" key={match.id}>
          <div className="list-row">
            <div>
              <p className="eyebrow">Match #{match.id}</p>
              <h3>Request #{match.request_id}</h3>
            </div>
            <StatusBadge value={match.status} />
          </div>
          {match.status === "pending" ? (
            <div className="card-actions">
              <button className="button button-primary" onClick={() => updateMatch(match.id, "accept")}>
                Accept
              </button>
              <button className="button button-secondary" onClick={() => updateMatch(match.id, "reject")}>
                Reject
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
