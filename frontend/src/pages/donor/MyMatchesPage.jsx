import { ChevronDown, ChevronUp, FileText, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

function RequestDetailPanel({ request, uploadUrl }) {
  const field = (label, value) => value ? (
    <div className="detail-field" key={label}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  ) : null;

  return (
    <div className="request-detail-section">
      <h4 className="detail-heading">Patient & Location</h4>
      {field("Patient name", request.patient_name)}
      {field("Blood group needed", request.blood_group_needed)}
      {field("Units required", request.units_required)}
      {field("Hospital", request.hospital_name)}
      {field("City", request.city)}
      {field("Area", request.area)}
      {field("Ward / Room", request.ward_room)}
      {field("Urgency", request.urgency_level)}
      {field("Required by", new Date(request.required_by).toLocaleDateString())}

      <h4 className="detail-heading">Attendant</h4>
      {field("Name", request.attendant_name)}
      {field("Phone", request.attendant_phone)}

      {request.additional_notes ? (
        <>
          <h4 className="detail-heading">Notes</h4>
          <p className="detail-notes">{request.additional_notes}</p>
        </>
      ) : null}

      {request.documents && request.documents.length > 0 ? (
        <>
          <h4 className="detail-heading">Documents</h4>
          <ul className="document-list">
            {request.documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={`${uploadUrl}/request-documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-link"
                >
                  <FileText size={14} />
                  {doc.document_type}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export default function MyMatchesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [requestDetails, setRequestDetails] = useState({});
  const [loadingRequest, setLoadingRequest] = useState({});
  const [error, setError] = useState("");

  const uploadUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000";

  const loadMatches = async () => {
    const data = await apiRequest("/matches/me", { token });
    setMatches(data);
  };

  useEffect(() => {
    loadMatches().finally(() => setLoading(false));
  }, [token]);

  const toggleExpand = async (matchId, requestId) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(matchId);
    if (!requestDetails[requestId] && !loadingRequest[requestId]) {
      setLoadingRequest((prev) => ({ ...prev, [requestId]: true }));
      try {
        const detail = await apiRequest(`/requests/${requestId}`, { token });
        setRequestDetails((prev) => ({ ...prev, [requestId]: detail }));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoadingRequest((prev) => ({ ...prev, [requestId]: false }));
      }
    }
  };

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
      {matches.map((match) => {
        const isExpanded = expandedMatchId === match.id;
        const detail = requestDetails[match.request_id];
        const loadingReq = loadingRequest[match.request_id];

        return (
          <div className="content-card" key={match.id}>
            <button
              className="card-expand-trigger"
              onClick={() => toggleExpand(match.id, match.request_id)}
              aria-expanded={isExpanded}
            >
              <div className="list-row">
                <div className="list-row-left">
                  <User size={15} />
                  <div>
                    <p className="eyebrow">Match #{match.id}</p>
                    <h3>Request #{match.request_id}</h3>
                  </div>
                </div>
                <StatusBadge value={match.status} />
              </div>
              <div className="expand-icon">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
            </button>

            {isExpanded ? (
              <div className="card-expand-content">
                <div className="card-actions">
                  {match.status === "pending" ? (
                    <>
                      <button className="button button-primary" onClick={() => updateMatch(match.id, "accept")}>
                        Accept
                      </button>
                      <button className="button button-secondary" onClick={() => updateMatch(match.id, "reject")}>
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
                {loadingReq ? (
                  <LoadingState label="Loading request details" />
                ) : detail ? (
                  <RequestDetailPanel request={detail} uploadUrl={uploadUrl} />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
