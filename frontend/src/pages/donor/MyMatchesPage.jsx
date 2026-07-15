import { ChevronDown, ChevronUp, Download, FileText, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { API_BASE_URL, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

function RequestDetailPanel({ request, token }) {
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docContentType, setDocContentType] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  const field = (label, value) => value ? (
    <div className="detail-field" key={label}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  ) : null;

  const openDocument = async (doc) => {
    setDocLoading(true);
    setDocError("");
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/request-documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to load document (${response.status})`);
      }
      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || "";
      const url = URL.createObjectURL(blob);
      setDocPreviewUrl(url);
      setDocContentType(contentType);
      setDocFileName(doc.file_url);
      setShowDocModal(true);
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  const closeDocModal = () => {
    if (docPreviewUrl) {
      URL.revokeObjectURL(docPreviewUrl);
    }
    setShowDocModal(false);
    setDocPreviewUrl(null);
    setDocContentType("");
    setDocFileName("");
    setDocError("");
  };

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
                <button type="button" className="document-link" onClick={() => openDocument(doc)}>
                  <FileText size={14} />
                  {doc.document_type}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {showDocModal ? (
        <div className="modal-overlay" onClick={closeDocModal}>
          <div className="modal-content document-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{docFileName}</h3>
              <div className="modal-header-actions">
                {docPreviewUrl ? (
                  <a className="button button-primary button-with-icon" href={docPreviewUrl} download={docFileName} onClick={(e) => e.stopPropagation()}>
                    <Download size={14} /> Download
                  </a>
                ) : null}
                <button type="button" className="modal-close" onClick={closeDocModal}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body document-preview-body">
              {docLoading ? (
                <p className="muted-label">Loading document...</p>
              ) : docError ? (
                <p className="error-text">{docError}</p>
              ) : docContentType.startsWith("image/") ? (
                <img src={docPreviewUrl} alt={docFileName} className="document-preview-img" />
              ) : docContentType === "application/pdf" ? (
                <iframe src={docPreviewUrl} title={docFileName} className="document-preview-pdf" />
              ) : (
                <div className="document-preview-fallback">
                  <p className="muted-label">Preview not available for this file type.</p>
                  {docPreviewUrl ? (
                    <a className="button button-primary" href={docPreviewUrl} download={docFileName}>Download file</a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
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
  if (matches.length === 0) return <EmptyState title="No assigned matches" description="Once a request is formally assigned to you (pending match), it will appear here for you to accept or decline." />;

  return (
    <div className="page-stack">
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      <section className="content-card">
        <SectionIntro
          eyebrow="Active assignments"
          title="My Matches"
          description="Requests formally matched to you. Accept to proceed or reject if you are unable to donate."
        />
      </section>
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
                  <RequestDetailPanel request={detail} token={token} />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
