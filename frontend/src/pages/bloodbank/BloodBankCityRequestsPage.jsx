import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";

export default function BloodBankCityRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiRequest("/api/v1/blood-banks/me/city-requests", { token })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading city requests" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="City demand"
          title="Blood requests in your city"
          description="Blood bank staff can monitor active demand from the same city and coordinate inventory decisions more quickly."
        />
      </section>
      {requests.length === 0 ? (
        <EmptyState title="No city requests found" description="No blood requests are currently listed for your blood bank city." />
      ) : (
        <div className="card-list">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} footer={`${request.confirmed_donor_count} confirmed donors`} />
          ))}
        </div>
      )}
    </div>
  );
}
