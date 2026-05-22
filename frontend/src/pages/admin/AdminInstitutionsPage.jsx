import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = ["all", "pending_approval", "approved", "rejected", "suspended"];

export default function AdminInstitutionsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadInstitutions = async (statusFilter = selectedStatus) => {
    const query = statusFilter === "all" ? "" : `?status_filter=${statusFilter}`;
    const data = await apiRequest(`/admin/institutions${query}`, { token });
    setInstitutions(data);
  };

  useEffect(() => {
    loadInstitutions().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [token]);

  const counts = useMemo(() => {
    return institutions.reduce(
      (accumulator, institution) => {
        accumulator[institution.status] = (accumulator[institution.status] || 0) + 1;
        return accumulator;
      },
      { pending_approval: 0, approved: 0, rejected: 0, suspended: 0 }
    );
  }, [institutions]);

  const applyDecision = async () => {
    if (!decision) return;
    await apiRequest(`/admin/institutions/${decision.id}/status`, {
      method: "PATCH",
      token,
      body: {
        status: decision.status,
        rejection_reason: decision.status === "rejected" ? rejectionReason : null,
      },
    });
    setDecision(null);
    setRejectionReason("");
    await loadInstitutions();
  };

  if (loading) return <LoadingState label="Loading institutions" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution moderation"
          title="Review institution registrations"
          description="Approve legitimate organizations for public discovery, pause suspicious accounts, or send rejected submissions back with a reason."
        />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <div className="filter-row">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${selectedStatus === filter ? "button-primary" : "button-tertiary"}`}
              onClick={async () => {
                setSelectedStatus(filter);
                await loadInstitutions(filter);
              }}
            >
              {filter.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="inline-metrics">
          <span>Pending: {counts.pending_approval}</span>
          <span>Approved: {counts.approved}</span>
          <span>Rejected: {counts.rejected}</span>
          <span>Suspended: {counts.suspended}</span>
        </div>
      </section>

      {institutions.length === 0 ? (
        <EmptyState title="No institutions found" description="Institution submissions matching this filter will appear here." />
      ) : (
        <div className="stacked-cards">
          {institutions.map((institution) => (
            <div className="info-card" key={institution.id}>
              <div className="list-row">
                <div>
                  <strong>{institution.institution_name}</strong>
                  <p>{institution.institution_type} / {institution.city}</p>
                </div>
                <StatusBadge value={institution.status} />
              </div>
              <p>{institution.contact_person}{institution.contact_person_designation ? `, ${institution.contact_person_designation}` : ""}</p>
              <p>{institution.email} / {institution.phone}</p>
              <p>{institution.address}</p>
              {institution.rejection_reason ? <p><strong>Rejection reason:</strong> {institution.rejection_reason}</p> : null}
              <div className="card-actions">
                <button className="button button-primary" onClick={() => setDecision({ id: institution.id, status: "approved" })}>
                  Approve
                </button>
                <button className="button button-secondary" onClick={() => setDecision({ id: institution.id, status: "rejected" })}>
                  Reject
                </button>
                <button className="button button-tertiary" onClick={() => setDecision({ id: institution.id, status: "suspended" })}>
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(decision)}
        title={decision?.status === "approved" ? "Approve institution?" : decision?.status === "rejected" ? "Reject institution?" : "Suspend institution?"}
        description={
          decision?.status === "approved"
            ? "This will make the institution visible to receivers and unlock institution messaging."
            : decision?.status === "rejected"
              ? "Provide a rejection reason before confirming so the institution understands what needs correction."
              : "This will hide the institution publicly and stop institution messaging until reapproved."
        }
        confirmLabel={decision?.status === "approved" ? "Approve" : decision?.status === "rejected" ? "Reject" : "Suspend"}
        onCancel={() => {
          setDecision(null);
          setRejectionReason("");
        }}
        onConfirm={applyDecision}
      >
        {decision?.status === "rejected" ? (
          <label className="form-span">
            Rejection reason
            <textarea rows="3" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what details are missing or why the institution cannot be approved yet." />
          </label>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
