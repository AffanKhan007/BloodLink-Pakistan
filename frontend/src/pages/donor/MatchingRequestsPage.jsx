import { HeartHandshake, MapPin, Search, XCircle } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import FilterToolbar from "../../components/FilterToolbar";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";

export default function MatchingRequestsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [error, setError] = useState("");
  const [declining, setDeclining] = useState({});

  useEffect(() => {
    apiRequest("/donors/matching-requests", { token })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  const declineRequest = async (requestId) => {
    setDeclining((prev) => ({ ...prev, [requestId]: true }));
    setError("");
    try {
      await apiRequest(`/requests/${requestId}/decline`, { method: "POST", token });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeclining((prev) => ({ ...prev, [requestId]: false }));
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
      const matchesUrgency = urgency === "all" || request.urgency_level === urgency;
      return matchesQuery && matchesUrgency;
    });
  }, [deferredSearch, requests, urgency]);

  if (loading) return <LoadingState label="Loading matching requests" />;
  if (requests.length === 0) {
    return <EmptyState title="No matching requests" description="When compatible requests fit your profile, they will appear here." />;
  }

  return (
    <div className="page-stack">
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      <section className="content-card">
        <SectionIntro
          eyebrow="Search and filter"
          title="Matching requests"
          description="Use quick filters to focus on nearby requests, urgent cases, or specific hospital demand."
        />
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by hospital, patient, city, or blood group"
          summary={
            <span className="toolbar-result">
              <Search size={13} />
              {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"} shown
            </span>
          }
          filters={[
            {
              label: "Urgency",
              value: urgency,
              onChange: setUrgency,
              options: [
                { value: "all", label: "All urgency" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ],
            },
          ]}
        />
      </section>

      {filteredRequests.length === 0 ? (
        <EmptyState title="No requests match those filters" description="Try broadening the urgency or search term to see more matching requests." />
      ) : (
        <div className="card-list">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              footer={`${request.hospital_name} / ${request.city}`}
              actions={
                <>
                  <div className="inline-pills">
                    <span className="pill pill-soft">
                      <MapPin size={12} />
                      {request.city}
                    </span>
                    <span className="pill pill-soft">
                      <HeartHandshake size={12} />
                      {request.confirmed_donor_count} confirmed
                    </span>
                  </div>
                  <button
                    className="button button-secondary button-with-icon"
                    onClick={() => declineRequest(request.id)}
                    disabled={declining[request.id]}
                  >
                    <XCircle size={14} />
                    {declining[request.id] ? "Declining..." : "Not available"}
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
