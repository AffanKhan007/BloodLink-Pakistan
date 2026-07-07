import { Droplets, Search, ShieldCheck } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { API_BASE_URL, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import FilterToolbar from "../../components/FilterToolbar";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function BloodRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedCardRequestId, setSelectedCardRequestId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [requestDetail, setRequestDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
          description="Search current demand, filter by status, and open donor matching for approved coordination opportunities."
        />
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search hospital, patient, city, or blood group"
          summary={
            <span className="toolbar-result">
              <Search size={15} />
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
              onClick={() => setSelectedCardRequestId(selectedCardRequestId === request.id ? null : request.id)}
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
      )}

      {selectedRequestId ? (
        <section className="content-card">
          <SectionIntro
            eyebrow="Matching donors"
            title={`Request #${selectedRequestId}`}
            description="Eligible donors already satisfy the MVP checks for approval, availability, city, and donation recency."
          />
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
                        {donor.blood_group} / {donor.city}, {donor.area}
                      </p>
                    </div>
                    <StatusBadge value={donor.verification_status} />
                  </div>
                  <div className="inline-pills">
                    <span className="pill pill-soft">
                      <ShieldCheck size={14} />
                      {donor.availability_status}
                    </span>
                    <span className="pill pill-soft">
                      <Droplets size={14} />
                      {donor.blood_group}
                    </span>
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
          <SectionIntro eyebrow="Verification files" title="Hospital slip documents" description="Open protected uploads in a separate tab for review." />
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
