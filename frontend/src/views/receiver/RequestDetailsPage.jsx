import { Building2, HeartHandshake, MessageSquarePlus, Radar, Search, Warehouse } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";
import { storeNavigationState, useNavigationState } from "../../utils/navigationState";

export default function RequestDetailsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const navigationState = useNavigationState();
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(navigationState?.createdRequest || null);
  const [matches, setMatches] = useState([]);
  const [matchingDonors, setMatchingDonors] = useState([]);
  const [reportForm, setReportForm] = useState({ reported_user_id: "", reason: "" });
  const [message, setMessage] = useState(navigationState?.flashSuccess || "");
  const [error, setError] = useState(navigationState?.flashError || "");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const requestData = await apiRequest(`/requests/${requestId}`, { token });
      if (!requestData) {
        setError("Request data returned empty");
        setLoading(false);
        return;
      }
      setRequest(requestData);
    } catch (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    apiRequest(`/matches/request/${requestId}`, { token })
      .then(setMatches)
      .catch(() => {});

    apiRequest(`/requests/${requestId}/matching-donors`, { token })
      .then((data) => setMatchingDonors(data || []))
      .catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    if (!requestId) {
      setError("No request ID specified");
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (navigationState?.createdRequest) {
      setLoading(false);
      return;
    }
    load();
  }, [requestId, token, navigationState?.createdRequest]);

  const startChat = async (targetUserId, subject) => {
    try {
      const chat = await apiRequest("/chats", {
        method: "POST",
        token,
        body: {
          target_user_id: targetUserId,
          request_id: Number(requestId),
          subject,
        },
      });
      storeNavigationState("/receiver/chats", { chatId: chat.id });
      router.push("/receiver/chats");
    } catch (chatError) {
      setError(chatError.message);
    }
  };

  const markFulfilled = async () => {
    setError("");
    try {
      const updated = await apiRequest(`/requests/${requestId}/mark-fulfilled`, { method: "PATCH", token });
      setRequest((current) => ({ ...(current || {}), ...updated }));
      await load();
      setMessage("Request marked as fulfilled.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const cancelRequest = async () => {
    setError("");
    try {
      const updated = await apiRequest(`/requests/${requestId}/cancel`, { method: "PATCH", token });
      setRequest((current) => ({ ...(current || {}), ...updated }));
      setConfirmCancelOpen(false);
      await load();
      setMessage("Request cancelled successfully.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("document_type", "hospital_slip");
      formData.append("file", file);
      await apiRequest(`/requests/${requestId}/upload-document`, {
        method: "POST",
        token,
        body: formData,
        isFormData: true,
      });
      setMessage("Document uploaded successfully.");
      await load();
    } catch (uploadError) {
      setError(uploadError.message);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/reports", {
        method: "POST",
        token,
        body: {
          reported_user_id: Number(reportForm.reported_user_id),
          request_id: Number(requestId),
          reason: reportForm.reason,
        },
      });
      setReportForm({ reported_user_id: "", reason: "" });
      setMessage("Report submitted for admin review.");
    } catch (reportError) {
      setError(reportError.message);
    }
  };

  if (loading) return <LoadingState label="Loading request details" />;
  if (error) return <div className="page-stack"><AlertMessage type="error">{error}</AlertMessage></div>;
  if (!request) return <EmptyState title="Request not found" description="This request may have been removed." />;

  return (
    <div className="page-stack">
      {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

      <section className="content-card">
        <div className="list-row">
          <div>
            <p className="eyebrow">{request.blood_group_needed} blood request</p>
            <h2>{request.patient_name}</h2>
          </div>
          <StatusBadge value={request.status} />
        </div>
        <div className="request-grid">
          <div>
            <span className="meta-label">Hospital</span>
            <strong>{request.hospital_name}</strong>
          </div>
          <div>
            <span className="meta-label">Required by</span>
            <strong>{formatDate(request.required_by)}</strong>
          </div>
          <div>
            <span className="meta-label">Urgency</span>
            <strong>{request.urgency_level}</strong>
          </div>
          <div>
            <span className="meta-label">Confirmed donors</span>
            <strong>{request.confirmed_donor_count}</strong>
          </div>
          {request.additional_notes ? (
            <div>
              <span className="meta-label">Additional notes</span>
              <strong>{request.additional_notes}</strong>
            </div>
          ) : null}
        </div>
        <div className="card-actions">
          {["pending_review", "approved", "matched"].includes(request.status) ? (
            <button className="button button-primary" onClick={markFulfilled}>
              Mark fulfilled
            </button>
          ) : null}
          {["pending_review", "approved", "matched"].includes(request.status) ? (
            <button className="button button-secondary" onClick={() => setConfirmCancelOpen(true)}>
              Cancel request
            </button>
          ) : null}
        </div>
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Support channels" title="Same-city support" compact />
        <div className="card-actions">
          <Link className="button button-secondary" href="/receiver/available-donors">
            <Search size={14} />
            Public donors
          </Link>
          <Link className="button button-secondary" href="/receiver/blood-banks">
            <Warehouse size={14} />
            Blood banks
          </Link>
          <Link className="button button-secondary" href="/receiver/institutions">
            <Building2 size={14} />
            Institutions
          </Link>
          <Link className="button button-secondary" href="/receiver/chats">
            <HeartHandshake size={14} />
            Open chats
          </Link>
        </div>
      </section>

      <section className="content-card">
        <SectionIntro
          eyebrow="Blood Radar"
          title="Live radar for this request"
          compact
        />
        <div className="card-actions">
          <Link
            className="button button-primary"
            href={`/blood-radar?blood_group=${request.blood_group_needed}&city=${encodeURIComponent(request.city)}`}
          >
            <Radar size={14} />
            Open Blood Radar
          </Link>
        </div>
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Available donors" title={`Compatible donors in ${request.city}`} compact />
        {matchingDonors.length === 0 ? (
          <EmptyState title="No matching donors found" description="No verified donors match this city and blood group yet." />
        ) : (
          <div className="stacked-cards">
            {matchingDonors.map((donor) => (
              <div className="info-card" key={donor.id}>
                <div className="list-row">
                  <strong>{donor.user.full_name}</strong>
                </div>
                <p>{donor.blood_group} donor &middot; {donor.city}, {donor.area} &middot; {donor.gender}, {donor.age} yrs</p>
                <p className="meta-label">{donor.availability_status === "available" ? "Available" : "Unavailable"}</p>
                <div className="card-actions">
                  <button
                    className="button button-primary button-with-icon"
                    onClick={() =>
                      startChat(
                        donor.user.id,
                        `Blood request for ${request.patient_name}`
                      )
                    }
                  >
                    Message donor
                    <MessageSquarePlus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Hospital slip" title="Documents" compact />
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={uploadDocument} />
        <div className="stacked-cards">
          {request.documents?.length ? (
            request.documents.map((document) => (
              <div className="info-card" key={document.id}>
                <strong>{document.document_type}</strong>
                <p>Uploaded at {formatDate(document.uploaded_at)}</p>
              </div>
            ))
          ) : (
            <EmptyState title="No documents yet" description="Upload the hospital slip for review." />
          )}
        </div>
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Matched donors" title="Assigned coordination" compact />
        {matches.length === 0 ? (
          <EmptyState title="No donors assigned yet" description="Assigned donors will appear here." />
        ) : (
          <div className="stacked-cards">
            {matches.map((match) => (
              <div className="info-card" key={match.id}>
                <div className="list-row">
                  <strong>{match.donor.user.full_name}</strong>
                  <StatusBadge value={match.status} />
                </div>
                <p>{match.donor.blood_group} donor in {match.donor.city}</p>
                <div className="card-actions">
                  <button
                    className="button button-primary button-with-icon"
                    onClick={() =>
                      startChat(
                        match.donor.user.id,
                        `Request support for ${request.patient_name}`
                      )
                    }
                  >
                    Message donor
                    <MessageSquarePlus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Safety" title="Report suspicious behavior" compact />
        {matches.length === 0 ? (
          <EmptyState title="No donors to report" description="Reports are available after assignment." />
        ) : (
          <form className="grid-form" onSubmit={submitReport}>
            <label>
              Donor
              <select
                value={reportForm.reported_user_id}
                onChange={(event) => setReportForm((current) => ({ ...current, reported_user_id: event.target.value }))}
                required
              >
                <option value="">Select donor</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.donor.user.id}>
                    {match.donor.user.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-span">
              Reason
              <textarea
                rows="4"
                placeholder="Explain the suspicious behavior or inconsistency."
                value={reportForm.reason}
                onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}
                required
              />
            </label>
            <div className="form-span">
              <button className="button button-secondary">Submit report</button>
            </div>
          </form>
        )}
      </section>

      <ConfirmModal
        open={confirmCancelOpen}
        title="Cancel this request?"
        description="This closes the request and cancels any remaining pending matches."
        confirmLabel="Cancel request"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={cancelRequest}
      />
    </div>
  );
}
