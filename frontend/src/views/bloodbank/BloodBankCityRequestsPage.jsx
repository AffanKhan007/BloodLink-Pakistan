import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";

export default function BloodBankCityRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/blood-banks/me/city-requests", { token });
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token]);

  const handleFulfill = async (requestId) => {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/blood-requests/${requestId}/fulfill`, {
        method: "POST",
        token,
        body: {},
      });
      setMessage(`Request ${requestId} marked as fulfilled.`);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingState label="Loading city requests" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="City demand"
          title="Blood requests in your city"
          description="Blood bank staff can monitor active demand from the same city and coordinate inventory decisions more quickly."
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>
      {requests.length === 0 ? (
        <EmptyState title="No city requests found" description="No blood requests are currently listed for your blood bank city." />
      ) : (
        <div className="card-list">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              footer={`${request.confirmed_donor_count || 0} confirmed donors`}
              actions={
                request.status !== "fulfilled" ? (
                  <button className="button button-primary" onClick={() => handleFulfill(request.id)}>
                    <CheckCircle2 size={14} /> Fulfill
                  </button>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
