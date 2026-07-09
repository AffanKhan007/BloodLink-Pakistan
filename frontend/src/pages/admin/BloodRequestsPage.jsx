import { FileText, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { API_BASE_URL, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import FilterToolbar from "../../components/FilterToolbar";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function BloodRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedCardRequestId, setSelectedCardRequestId] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = async () => {
    const data = await apiRequest("/admin/requests", { token });
    setRequests(data);
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, [token]);

  const loadDetail = async (requestId) => {
    setDetailLoading(true);
    setDetailRequest(null);
    try {
      const data = await apiRequest(`/admin/requests/${requestId}/detail`, { token });
      setDetailRequest(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    await apiRequest(`/admin/requests/${requestId}/${action}`, { method: "PATCH", token });
    await loadRequests();
    if (selectedCardRequestId === requestId) {
      await loadDetail(requestId);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    await apiRequest(`/admin/requests/${requestId}/status`, {
      method: "PATCH",
      token,
      body: { status: newStatus },
    });
    await loadRequests();
    if (selectedCardRequestId === requestId) {
      await loadDetail(requestId);
    }
  };

  const handleCardClick = (requestId) => {
    if (selectedCardRequestId === requestId) {
      setSelectedCardRequestId(null);
      setDetailRequest(null);
    } else {
      setSelectedCardRequestId(requestId);
      loadDetail(requestId);
    }
  };

  const deferredSearch = useDeferredValue(search);
  const filteredRequests = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesQuery =
        !query ||
        [request.patient_name, request.hospital_name, request.city, request.area, request.blood_group_needed]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [deferredSearch, requests, statusFilter]);

  if (loading) return <LoadingState label="Loading blood requests" />;
  if (requests.length === 0) return <EmptyState title="No requests found" description="Submitted requests will appear here for review." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Request triage"
          title="Review blood requests"
          description="Approve verified requests to trigger automatic donor matching, or reject non-qualifying submissions."
        />
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search hospital, patient, city, or blood group"
          summary={
            <span className="toolbar-result">
              <Search size={13} />
              {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"} shown
            </span>
          }
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All statuses" },
                { value: "pending_review", label: "Pending review" },
                { value: "approved", label: "Approved" },
                { value: "matched", label: "Matched" },
                { value: "fulfilled", label: "Fulfilled" },
                { value: "rejected", label: "Rejected" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
          ]}
        />
      </section>

      {filteredRequests.length === 0 ? (
        <EmptyState title="No requests match those filters" description="Try a broader status or search term to see more demand." />
      ) : (
        <div className="card-list">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              footer={`Confirmed donors: ${request.confirmed_donor_count}`}
              selected={selectedCardRequestId === request.id}
              onClick={() => handleCardClick(request.id)}
              actions={
                request.status === "pending_review" ? (
                  <>
                    <button className="button button-primary" onClick={(e) => { e.stopPropagation(); handleAction(request.id, "approve"); }}>
                      Approve
                    </button>
                    <button className="button button-secondary" onClick={(e) => { e.stopPropagation(); handleAction(request.id, "reject"); }}>
                      Reject
                    </button>
                  </>
                ) : (
                  <div className="inline-pills" style={{ gap: "0.5rem", flexWrap: "nowrap" }}>
                    <StatusBadge value={request.status} />
                    <select
                      className="pill pill-soft"
                      value={request.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      style={{
                        padding: "0.3rem 0.5rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "1px solid var(--border)",
                        borderRadius: "999px",
                        background: "var(--color-surface-alt)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              }
            />
          ))}
        </div>
      )}

      {selectedCardRequestId && detailLoading && (
        <LoadingState label="Loading request details" />
      )}

      {selectedCardRequestId && detailRequest && (
        <section className="content-card">
          <SectionIntro
            eyebrow="Full request details"
            title={`Request #${detailRequest.id} — ${detailRequest.patient_name}`}
            description="All fields submitted at request creation time."
          />
          <div className="grid-form" style={{ marginTop: "0.5rem" }}>
            <div>
              <span className="meta-label">Patient name</span>
              <strong>{detailRequest.patient_name}</strong>
            </div>
            <div>
              <span className="meta-label">Blood group needed</span>
              <strong>{detailRequest.blood_group_needed}</strong>
            </div>
            <div>
              <span className="meta-label">Units required</span>
              <strong>{detailRequest.units_required}</strong>
            </div>
            <div>
              <span className="meta-label">Urgency level</span>
              <strong>{detailRequest.urgency_level}</strong>
            </div>
            <div className="form-span">
              <span className="meta-label">Hospital</span>
              <strong>{detailRequest.hospital_name}</strong>
            </div>
            <div>
              <span className="meta-label">City</span>
              <strong>{detailRequest.city}</strong>
            </div>
            <div>
              <span className="meta-label">Area</span>
              <strong>{detailRequest.area}</strong>
            </div>
            <div>
              <span className="meta-label">Ward / Room</span>
              <strong>{detailRequest.ward_room}</strong>
            </div>
            <div>
              <span className="meta-label">Required by</span>
              <strong>{detailRequest.required_by ? new Date(detailRequest.required_by).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—"}</strong>
            </div>
            <div>
              <span className="meta-label">Status</span>
              <StatusBadge value={detailRequest.status} />
            </div>
            <div>
              <span className="meta-label">Attendant name</span>
              <strong>{detailRequest.attendant_name}</strong>
            </div>
            <div>
              <span className="meta-label">Attendant phone</span>
              <strong>{detailRequest.attendant_phone}</strong>
            </div>
            {detailRequest.additional_notes && (
              <div className="form-span">
                <span className="meta-label">Additional notes</span>
                <p style={{ margin: "0.25rem 0 0" }}>{detailRequest.additional_notes}</p>
              </div>
            )}
          </div>

          {detailRequest.documents?.length > 0 && (
            <>
              <SectionIntro
                eyebrow="Verification files"
                title={`${detailRequest.documents.length} uploaded document${detailRequest.documents.length === 1 ? "" : "s"}`}
                description="Open protected uploads in a separate tab for review."
              />
              <div className="stacked-cards" style={{ marginTop: "0.5rem" }}>
                {detailRequest.documents.map((doc) => (
                  <div className="info-card" key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <FileText size={15} />
                      <div>
                        <strong>{doc.document_type}</strong>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                          {new Date(doc.uploaded_at).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                        </p>
                      </div>
                    </div>
                    <a className="button button-secondary" href={`${API_BASE_URL}/uploads/request-documents/${doc.id}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      View document
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}