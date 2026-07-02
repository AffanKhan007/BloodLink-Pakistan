import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";

export default function MyRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const loadRequests = async () => {
    const data = await apiRequest("/requests", { token });
    setRequests(data);
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, [token]);

  const cancelRequest = async () => {
    await apiRequest(`/requests/${confirmId}/cancel`, { method: "PATCH", token });
    setConfirmId(null);
    await loadRequests();
  };

  const markFulfilled = async (requestId) => {
    await apiRequest(`/requests/${requestId}/mark-fulfilled`, { method: "PATCH", token });
    await loadRequests();
  };

  if (loading) return <LoadingState label="Loading requests" />;
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No requests created"
        description="Your submitted requests will be listed here once you create the first blood request."
        action={
          <Link className="button button-primary" to="/receiver/create-request">
            Create request
          </Link>
        }
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Receiver requests"
          title="My request list"
          description="Open each request to manage slips, support channels, donor conversations, and fulfillment status."
          actions={
            <Link className="button button-primary" to="/receiver/create-request">
              Create request
            </Link>
          }
        />
      </section>
      <div className="card-list">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            footer={`${request.confirmed_donor_count} confirmed donors`}
            actions={
              <>
                <Link className="button button-secondary" to={`/receiver/requests/${request.id}`}>
                  View details
                </Link>
                {["pending_review", "approved", "matched"].includes(request.status) ? (
                  <button className="button button-primary" onClick={() => markFulfilled(request.id)}>
                    Mark fulfilled
                  </button>
                ) : null}
                {["pending_review", "approved", "matched"].includes(request.status) ? (
                  <button className="button button-secondary" onClick={() => setConfirmId(request.id)}>
                    Cancel
                  </button>
                ) : null}
              </>
            }
          />
        ))}
      </div>
      <ConfirmModal
        open={Boolean(confirmId)}
        title="Cancel this request?"
        description="This will close the active request and cancel any pending matches."
        confirmLabel="Cancel request"
        onCancel={() => setConfirmId(null)}
        onConfirm={cancelRequest}
      />
    </div>
  );
}
