import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = ["all", "pending", "approved", "rejected", "suspended"];

export default function AdminBloodBanksPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [editingStatusId, setEditingStatusId] = useState(null);

  const loadBanks = async (statusFilter = selectedStatus) => {
    const query = statusFilter === "all" ? "" : `?status_filter=${statusFilter}`;
    const data = await apiRequest(`/api/v1/blood-banks/admin/all${query}`, { token });
    setBanks(data);
  };

  useEffect(() => {
    loadBanks().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [token]);

  const counts = useMemo(() => {
    return banks.reduce(
      (acc, bank) => {
        acc[bank.verification_status] = (acc[bank.verification_status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, suspended: 0 }
    );
  }, [banks]);

  const applyDecision = async () => {
    if (!decision) return;
    await apiRequest(`/api/v1/blood-banks/${decision.id}/admin/status`, {
      method: "PATCH",
      token,
      body: {
        status: decision.status,
        rejection_reason: decision.status === "rejected" ? rejectionReason : null,
      },
    });
    setDecision(null);
    setRejectionReason("");
    setEditingStatusId(null);
    await loadBanks();
  };

  const needsReverification = (bank) => {
    if (!bank.verified_at) return false;
    const verified = new Date(bank.verified_at);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    return verified < twelveMonthsAgo;
  };

  const actionButton = (bank) => {
    if (bank.verification_status === "pending") {
      return (
        <>
          <button className="button button-primary" onClick={(event) => { event.stopPropagation(); setDecision({ id: bank.id, status: "approved" }); }}>
            Approve
          </button>
          <button className="button button-secondary" onClick={(event) => { event.stopPropagation(); setDecision({ id: bank.id, status: "rejected" }); }}>
            Reject
          </button>
        </>
      );
    }

    if (editingStatusId !== bank.id) {
      return (
        <button className="button button-tertiary" onClick={(event) => { event.stopPropagation(); setEditingStatusId(bank.id); }}>
          Edit status
        </button>
      );
    }

    if (bank.verification_status === "approved") {
      return (
        <>
          <button className="button button-secondary" onClick={(event) => { event.stopPropagation(); setDecision({ id: bank.id, status: "rejected" }); }}>
            Mark rejected
          </button>
          <button className="button button-tertiary" onClick={(event) => { event.stopPropagation(); setDecision({ id: bank.id, status: "suspended" }); }}>
            Suspend
          </button>
        </>
      );
    }

    return (
      <button className="button button-primary" onClick={(event) => { event.stopPropagation(); setDecision({ id: bank.id, status: "approved" }); }}>
        Restore approval
      </button>
    );
  };

  if (loading) return <LoadingState label="Loading blood banks" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Blood banks"
          title="Review blood bank registrations"
          description="Manage verification status of blood bank accounts."
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
                await loadBanks(filter);
              }}
            >
              {filter.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="inline-metrics">
          <span>Pending: {counts.pending}</span>
          <span>Approved: {counts.approved}</span>
          <span>Rejected: {counts.rejected}</span>
          <span>Suspended: {counts.suspended}</span>
        </div>
      </section>

      {banks.length === 0 ? (
        <EmptyState title="No blood banks found" description="Matching submissions will appear here." />
      ) : (
        <div className="stacked-cards">
          {banks.map((bank) => (
            <div
              className={`info-card${selectedBankId === bank.id ? " info-card-selected" : ""}`}
              key={bank.id}
              onClick={() => setSelectedBankId(selectedBankId === bank.id ? null : bank.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedBankId(selectedBankId === bank.id ? null : bank.id);
                }
              }}
            >
              <div className="list-row">
                <div>
                  <strong>{bank.name}</strong>
                  <p>{bank.city}</p>
                </div>
                <StatusBadge value={bank.verification_status} />
              </div>
              <p>{bank.contact_person_name || "No contact"}</p>
              {needsReverification(bank) && (
                <p style={{ color: "var(--color-urgent)" }}>Needs re-verification (verified over 12 months ago)</p>
              )}
              {selectedBankId === bank.id && (
                <div style={{ marginTop: "0.5rem" }}>
                  <p><strong>License:</strong> {bank.license_number || "N/A"}</p>
                  <p><strong>Contact CNIC:</strong> {bank.contact_cnic || "N/A"}</p>
                  <p><strong>Operating hours:</strong> {bank.operating_hours || "N/A"}</p>
                  {bank.rejection_reason && <p><strong>Rejection reason:</strong> {bank.rejection_reason}</p>}
                  <div className="card-actions">
                    {actionButton(bank)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(decision)}
        title={decision?.status === "approved" ? "Approve blood bank?" : decision?.status === "rejected" ? "Reject blood bank?" : "Suspend blood bank?"}
        description={
          decision?.status === "approved"
            ? "This will make the blood bank visible publicly and unlock its dashboard."
            : decision?.status === "rejected"
              ? "Provide a rejection reason before confirming so the bank understands what needs correction."
              : "This will hide the blood bank publicly and disable its dashboard until reapproved."
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
            <textarea rows="3" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what details are missing or why the bank cannot be approved yet." />
          </label>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
