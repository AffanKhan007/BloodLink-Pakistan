import { Flag } from "lucide-react";
import { useState } from "react";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AlertMessage } from "./PageState";

const REASON_OPTIONS = [
  { value: "fake_request", label: "Fake request" },
  { value: "spam", label: "Spam" },
  { value: "abusive_messages", label: "Abusive messages" },
  { value: "harassment", label: "Harassment" },
  { value: "fake_institution", label: "Fake institution" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ open, onClose, reportedType, reportedId, title = "Report issue" }) {
  const { token } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setReason("");
    setDescription("");
    setEvidenceFile(null);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("reported_type", reportedType);
      formData.append("reported_id", String(reportedId));
      formData.append("reason", reason);
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (evidenceFile) {
        formData.append("evidence", evidenceFile);
      }
      await apiRequest("/reports", {
        method: "POST",
        token,
        body: formData,
        isFormData: true,
      });
      setSuccess("Report submitted — our team will review it.");
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-icon">
          <Flag size={16} />
        </div>
        <h3>{title}</h3>
        <p>Tell us what happened. Your report is reviewed by the BloodLink moderation team.</p>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        {success ? <AlertMessage type="success">{success}</AlertMessage> : null}
        <form className="modal-body grid-form" onSubmit={handleSubmit}>
          <label>
            Reason
            <select value={reason} onChange={(event) => setReason(event.target.value)} required>
              <option value="">Select a reason</option>
              {REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-span">
            Description (optional)
            <textarea
              rows="4"
              placeholder="Share any helpful context for our review team."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className="form-span">
            Evidence (optional)
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) => setEvidenceFile(event.target.files?.[0] || null)}
            />
          </label>
          <div className="modal-actions form-span">
            <button type="button" className="button button-secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={submitting || Boolean(success)}>
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
