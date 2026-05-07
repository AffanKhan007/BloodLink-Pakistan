import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

export default function DonorsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);

  const loadDonors = async () => {
    const data = await apiRequest("/admin/donors", { token });
    setDonors(data);
  };

  useEffect(() => {
    loadDonors().finally(() => setLoading(false));
  }, [token]);

  const applyAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "block") {
      await apiRequest(`/admin/users/${pendingAction.userId}/block`, { method: "PATCH", token });
    } else {
      await apiRequest(`/admin/donors/${pendingAction.donorId}/verify`, {
        method: "PATCH",
        token,
        body: { verification_status: pendingAction.type },
      });
    }
    setPendingAction(null);
    await loadDonors();
  };

  if (loading) return <LoadingState label="Loading donors" />;
  if (donors.length === 0) return <EmptyState title="No donor profiles" description="Donor profiles will appear here after registration." />;

  return (
    <div className="stacked-cards">
      {donors.map((donor) => (
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
          <div className="card-actions">
            <button className="button button-primary" onClick={() => setPendingAction({ type: "approved", donorId: donor.id })}>
              Approve
            </button>
            <button className="button button-secondary" onClick={() => setPendingAction({ type: "rejected", donorId: donor.id })}>
              Reject
            </button>
            <button className="button button-secondary" onClick={() => setPendingAction({ type: "block", donorId: donor.id, userId: donor.user.id })}>
              Block
            </button>
          </div>
        </div>
      ))}

      <ConfirmModal
        open={Boolean(pendingAction)}
        title="Confirm donor action"
        description="Use rejection for profile review failures, and blocking only for suspicious or unsafe accounts."
        confirmLabel="Confirm action"
        onCancel={() => setPendingAction(null)}
        onConfirm={applyAction}
        tone={pendingAction?.type === "approved" ? "primary" : "danger"}
      />
    </div>
  );
}

