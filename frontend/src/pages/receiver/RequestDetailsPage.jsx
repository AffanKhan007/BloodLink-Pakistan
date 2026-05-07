import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";

export default function RequestDetailsPage() {
  const { token } = useAuth();
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [reportForm, setReportForm] = useState({ reported_user_id: "", reason: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [requestData, matchData] = await Promise.all([
      apiRequest(`/requests/${requestId}`, { token }),
      apiRequest(`/matches/request/${requestId}`, { token }),
    ]);
    setRequest(requestData);
    setMatches(matchData);
  };

  useEffect(() => {
    load()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [requestId, token]);

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
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hospital slip</p>
            <h2>Documents</h2>
          </div>
        </div>
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
            <EmptyState title="No documents yet" description="Upload a hospital slip to help the admin review faster." />
          )}
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Matched donors</p>
            <h2>Assigned coordination</h2>
          </div>
        </div>
        {matches.length === 0 ? (
          <EmptyState title="No donors assigned yet" description="After admin approval, matches will appear here." />
        ) : (
          <div className="stacked-cards">
            {matches.map((match) => (
              <div className="info-card" key={match.id}>
                <div className="list-row">
                  <strong>{match.donor.user.full_name}</strong>
                  <StatusBadge value={match.status} />
                </div>
                <p>{match.donor.blood_group} donor in {match.donor.city}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Safety tools</p>
            <h2>Report suspicious donor behavior</h2>
          </div>
        </div>
        {matches.length === 0 ? (
          <EmptyState title="No donors to report" description="You can report suspicious donors after an admin assigns them to your request." />
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
    </div>
  );
}
