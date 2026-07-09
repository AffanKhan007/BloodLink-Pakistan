import { MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function AvailableDonorsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [donors, setDonors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/requests", { token })
      .then((data) => {
        setRequests(data);
        if (data[0]) setSelectedRequestId(data[0].id);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedRequestId) {
      setDonors([]);
      return;
    }
    apiRequest(`/requests/${selectedRequestId}/public-donors`, { token })
      .then(setDonors)
      .catch((loadError) => setError(loadError.message));
  }, [selectedRequestId, token]);

  const startChat = async (donor) => {
    const chat = await apiRequest("/chats", {
      method: "POST",
      token,
      body: {
        target_user_id: donor.user.id,
        request_id: selectedRequestId,
        subject: `Request for ${donor.blood_group} support`,
        initial_message: `Hello ${donor.user.full_name}, I am requesting help for this blood requirement.`,
      },
    });
    navigate("/receiver/chats", { state: { chatId: chat.id } });
  };

  if (loading) return <LoadingState label="Loading public donors" />;
  if (requests.length === 0) return <EmptyState title="No requests yet" description="Create a blood request first to view public donors in your city." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Public donor discovery"
          title="Available donors in your city"
          description="These donors have marked themselves publicly available and match the city and blood-group compatibility for your request."
        />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label>
          Select request
          <select value={selectedRequestId || ""} onChange={(event) => setSelectedRequestId(Number(event.target.value))}>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                #{request.id} - {request.patient_name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {donors.length === 0 ? (
        <EmptyState title="No public donors found" description="No publicly available donors currently match the city and blood-group rules for this request." />
      ) : (
        <div className="stacked-cards">
          {donors.map((donor) => (
            <div className="info-card" key={donor.id}>
              <div className="list-row">
                <div>
                  <strong>{donor.user.full_name}</strong>
                  <p>
                    {donor.blood_group} / {donor.city}, {donor.area}
                  </p>
                </div>
                <StatusBadge value={donor.availability_status} />
              </div>
              <div className="card-actions">
                <StatusBadge value={donor.verification_status} />
                <button className="button button-primary button-with-icon" onClick={() => startChat(donor)}>
                  Start chat
                  <MessageSquarePlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
