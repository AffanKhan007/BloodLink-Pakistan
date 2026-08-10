import { MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import { storeNavigationState } from "../../utils/navigationState";

export default function BloodBanksInCityPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [banks, setBanks] = useState([]);
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
      setBanks([]);
      return;
    }
    apiRequest(`/requests/${selectedRequestId}/blood-banks`, { token })
      .then(setBanks)
      .catch((loadError) => setError(loadError.message));
  }, [selectedRequestId, token]);

  const startChat = async (bank) => {
    if (!bank.contact_user_id) return;
    const chat = await apiRequest("/chats", {
      method: "POST",
      token,
      body: {
        target_user_id: bank.contact_user_id,
        request_id: selectedRequestId,
        subject: `Blood bank inquiry for ${bank.name}`,
      },
    });
    storeNavigationState("/receiver/chats", { chatId: chat.id });
    router.push("/receiver/chats");
  };

  if (loading) return <LoadingState label="Loading city blood banks" />;
  if (requests.length === 0) return <EmptyState title="No requests yet" description="Create a blood request first to see blood bank inventory in your city." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Blood banks"
          title="Blood banks in this city"
          description="View compatible stock and contacts."
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

      {banks.length === 0 ? (
        <EmptyState title="No blood banks found" description="No inventory is listed for this city yet." />
      ) : (
        <div className="stacked-cards">
          {banks.map((bank) => (
            <div className="info-card" key={bank.id}>
              <div className="list-row">
                <div>
                  <strong>{bank.name}</strong>
                  <p>{bank.city}{bank.area ? ` / ${bank.area}` : ""}</p>
                </div>
              </div>
              <div className="inline-pills">
                {bank.available_inventory.length === 0 ? (
                  <span className="pill pill-soft">No cleared compatible stock listed</span>
                ) : (
                  bank.available_inventory.map((item) => (
                    <span className="pill pill-soft" key={item.blood_group}>
                      {item.blood_group}: {item.total_units} units
                    </span>
                  ))
                )}
              </div>
              <p>{bank.contact_number || bank.email || bank.address}</p>
              {bank.contact_user_id ? (
                <button className="button button-primary button-with-icon" onClick={() => startChat(bank)}>
                  Message blood bank
                  <MessageSquarePlus size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
