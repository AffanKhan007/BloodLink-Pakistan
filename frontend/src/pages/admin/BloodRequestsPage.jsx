import { useEffect, useState } from "react";

import { API_BASE_URL, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import StatusBadge from "../../components/StatusBadge";

export default function BloodRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [requestDetail, setRequestDetail] = useState(null);

  const loadRequests = async () => {
    const data = await apiRequest("/admin/requests", { token });
    setRequests(data);
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, [token]);

  const updateStatus = async (requestId, action) => {
    await apiRequest(`/admin/requests/${requestId}/${action}`, { method: "PATCH", token });
    await loadRequests();
  };

  const loadCandidates = async (requestId) => {
    setSelectedRequestId(requestId);
    const [candidateData, detailData] = await Promise.all([
      apiRequest(`/admin/requests/${requestId}/candidates`, { token }),
      apiRequest(`/requests/${requestId}`, { token }),
    ]);
    setCandidates(candidateData);
    setRequestDetail(detailData);
  };

  const createMatch = async (donorId) => {
    await apiRequest("/matches", { method: "POST", token, body: { request_id: selectedRequestId, donor_id: donorId } });
    await loadRequests();
    await loadCandidates(selectedRequestId);
  };

  if (loading) return <LoadingState label="Loading blood requests" />;
  if (requests.length === 0) return <EmptyState title="No requests found" description="Submitted requests will appear here for review." />;

  return (
    <div className="page-stack">
      <div className="card-list">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            footer={`Confirmed donors: ${request.confirmed_donor_count}`}
            actions={
              <>
                <button className="button button-primary" onClick={() => updateStatus(request.id, "approve")}>
                  Approve
                </button>
                <button className="button button-secondary" onClick={() => updateStatus(request.id, "reject")}>
                  Reject
                </button>
                <button className="button button-secondary" onClick={() => loadCandidates(request.id)}>
                  Find matches
                </button>
              </>
            }
          />
        ))}
      </div>

      {selectedRequestId ? (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Matching donors</p>
              <h2>Request #{selectedRequestId}</h2>
            </div>
          </div>
          {candidates.length === 0 ? (
            <EmptyState title="No eligible donors" description="No approved, available donors matched the city and blood group filters yet." />
          ) : (
            <div className="stacked-cards">
              {candidates.map((donor) => (
                <div className="info-card" key={donor.id}>
                  <div className="list-row">
                    <div>
                      <strong>{donor.user.full_name}</strong>
                      <p>
                        {donor.blood_group} • {donor.city}, {donor.area}
                      </p>
                    </div>
                    <StatusBadge value={donor.verification_status} />
                  </div>
                  <button className="button button-primary" onClick={() => createMatch(donor.id)}>
                    Create match
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {requestDetail?.documents?.length ? (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Verification files</p>
              <h2>Hospital slip documents</h2>
            </div>
          </div>
          <div className="stacked-cards">
            {requestDetail.documents.map((document) => (
              <div className="info-card" key={document.id}>
                <div className="list-row">
                  <div>
                    <strong>{document.document_type}</strong>
                    <p>Document #{document.id}</p>
                  </div>
                  <a className="button button-secondary" href={`${API_BASE_URL}/uploads/request-documents/${document.id}`} target="_blank" rel="noreferrer">
                    View document
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
