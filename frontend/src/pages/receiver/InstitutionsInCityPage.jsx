import { MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

export default function InstitutionsInCityPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [institutions, setInstitutions] = useState([]);
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
      setInstitutions([]);
      return;
    }
    apiRequest(`/requests/${selectedRequestId}/institutions`, { token })
      .then(setInstitutions)
      .catch((loadError) => setError(loadError.message));
  }, [selectedRequestId, token]);

  const startChat = async (institution) => {
    const chat = await apiRequest("/chats", {
      method: "POST",
      token,
      body: {
        target_user_id: institution.user.id,
        request_id: selectedRequestId,
        subject: `Institution donor outreach: ${institution.institution_name}`,
      },
    });
    navigate("/receiver/chats", { state: { chatId: chat.id } });
  };

  if (loading) return <LoadingState label="Loading institution donors" />;
  if (requests.length === 0) return <EmptyState title="No requests yet" description="Create a blood request first to view institution donors in your city." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institutions"
          title="Institution donors in this city"
          description="Contact approved donor groups."
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

      {institutions.length === 0 ? (
        <EmptyState title="No institutions found" description="No approved groups are listed for this city yet." />
      ) : (
        <div className="stacked-cards">
          {institutions.map((institution) => (
            <div className="info-card" key={institution.id}>
              <div className="list-row">
                <div>
                  <strong>{institution.institution_name}</strong>
                  <p>{institution.institution_type} / {institution.city}</p>
                </div>
              </div>
              <p>{institution.contact_person}{institution.contact_person_designation ? ` / ${institution.contact_person_designation}` : ""}</p>
              <p>{institution.phone}</p>
              <p>{institution.available_blood_groups || "Blood groups not listed"}</p>
              <div className="card-actions">
                <button className="button button-primary button-with-icon" onClick={() => startChat(institution)}>
                  Message institution
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
