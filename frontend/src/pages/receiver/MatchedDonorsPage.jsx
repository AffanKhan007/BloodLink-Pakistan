import { MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function MatchedDonorsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

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
    apiRequest(`/matches/request/${selectedRequestId}`, { token })
      .then(setMatches)
      .catch((loadError) => setError(loadError.message));
  }, [selectedRequestId, token]);

  const startChat = async (match) => {
    try {
      const chat = await apiRequest("/chats", {
        method: "POST",
        token,
        body: {
          target_user_id: match.donor.user.id,
          request_id: selectedRequestId,
          subject: `Matched donor follow-up for request #${selectedRequestId}`,
          initial_message: `Hello ${match.donor.user.full_name}, I am reaching out about the matched blood request.`,
        },
      });
      navigate("/receiver/chats", { state: { chatId: chat.id } });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading matched donors" />;
  if (requests.length === 0) return <EmptyState title="No requests available" description="Create a request first to see donor assignments." />;

  return (
    <div className="page-stack">
      <div className="content-card">
        <SectionIntro
          eyebrow="Matched donors"
          title="Confirmed and pending donor assignments"
          description="Track matched donors for each request and open a conversation without exposing unnecessary private details."
        />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
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
        <EmptyState title="No donor assignments yet" description="Compatible donors will appear here once automatic matching finds candidates for this request." />
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
              <div className="card-actions">
                <button className="button button-primary button-with-icon" onClick={() => startChat(match)}>
                  Message donor
                  <MessageSquarePlus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
