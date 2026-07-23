import { Activity, Building2, CalendarClock, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage } from "../../components/PageState";
import CityCombobox from "../../components/CityCombobox";
import SectionIntro from "../../components/SectionIntro";

const initialForm = {
  patient_name: "",
  blood_group_needed: "A+",
  units_required: 1,
  hospital_name: "",
  city: "",
  area: "",
  ward_room: "",
  urgency_level: "high",
  attendant_name: "",
  attendant_phone: "",
  required_by: "",
  additional_notes: "",
};

export default function CreateRequestPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...initialForm, attendant_name: user?.full_name || "", attendant_phone: user?.phone || "" });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!documentFile) {
      setError("Hospital slip is required before submitting the request.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        required_by: new Date(form.required_by).toISOString(),
      };
      const request = await apiRequest("/requests", { method: "POST", token, body: payload });
      const formData = new FormData();
      formData.append("document_type", "hospital_slip");
      formData.append("file", documentFile);
      await apiRequest(`/requests/${request.id}/upload-document`, {
        method: "POST",
        token,
        body: formData,
        isFormData: true,
      });
      if (form.urgency_level === "critical") {
        navigate(`/blood-radar?blood_group=${request.blood_group_needed}&city=${encodeURIComponent(request.city)}`, {
          state: {
            flashSuccess: "Critical request created. Blood Radar is scanning for available blood now.",
            createdRequest: request,
          },
        });
      } else {
        navigate(`/receiver/requests/${request.id}`, {
          state: {
            flashSuccess: "Request created, hospital slip uploaded, and compatible donors have been checked automatically.",
            createdRequest: request,
          },
        });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Request"
          title="Create blood request"
          description="Add patient, hospital, and urgency details."
        />
        <div className="metrics-strip">
          <div className="metric-chip">
            <Building2 size={14} />
            <div>
              <span>Hospital context</span>
              <strong>Add patient location</strong>
            </div>
          </div>
          <div className="metric-chip">
            <CalendarClock size={14} />
            <div>
              <span>Required by</span>
              <strong>Set urgency timing</strong>
            </div>
          </div>
          <div className="metric-chip">
            <ShieldCheck size={14} />
            <div>
              <span>Automatic coordination</span>
              <strong>Matching starts after save</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card">
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
          <div className="form-section form-span">
            <div className="form-section-header">
              <h3>Patient and request details</h3>
              <p>Enter the core request details.</p>
            </div>
          </div>
          <label className="field-required">
            Patient name
            <input value={form.patient_name} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} required />
          </label>
          <label className="field-required">
            Blood group needed
            <select value={form.blood_group_needed} onChange={(event) => setForm((current) => ({ ...current, blood_group_needed: event.target.value }))}>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="field-required">
            Units required
            <input type="number" min="1" value={form.units_required} onChange={(event) => setForm((current) => ({ ...current, units_required: Number(event.target.value) }))} required />
          </label>
          <div className="form-section form-span">
            <div className="form-section-header">
              <h3>Hospital context</h3>
              <p>Add location and timing.</p>
            </div>
          </div>
          <label className="field-required">
            Hospital name
            <input value={form.hospital_name} onChange={(event) => setForm((current) => ({ ...current, hospital_name: event.target.value }))} required />
          </label>
          <label className="field-required city-combo-wrap">
            City
            <CityCombobox value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} required />
          </label>
          <label className="field-required">
            Area
            <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
          </label>
          <label className="field-required">
            Ward / room
            <input value={form.ward_room} onChange={(event) => setForm((current) => ({ ...current, ward_room: event.target.value }))} required />
          </label>
          <label className="field-required">
            Urgency
            <select value={form.urgency_level} onChange={(event) => setForm((current) => ({ ...current, urgency_level: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="field-required">
            Required by
            <input type="datetime-local" value={form.required_by} onChange={(event) => setForm((current) => ({ ...current, required_by: event.target.value }))} required />
          </label>
          <div className="form-section form-span">
            <div className="form-section-header">
              <h3>Attendant and verification</h3>
              <p>Provide contact and document details.</p>
            </div>
          </div>
          <label className="field-required">
            Attendant name
            <input value={form.attendant_name} onChange={(event) => setForm((current) => ({ ...current, attendant_name: event.target.value }))} required />
          </label>
          <label className="field-required">
            Attendant phone
            <input value={form.attendant_phone} onChange={(event) => setForm((current) => ({ ...current, attendant_phone: event.target.value }))} required />
          </label>
          <label className="form-span">
            Additional notes
            <textarea
              rows="4"
              value={form.additional_notes}
              onChange={(event) => setForm((current) => ({ ...current, additional_notes: event.target.value }))}
              placeholder="Add patient context, special instructions, or anything helpful for coordination."
            />
          </label>
          <label className="form-span field-required file-upload-field">
            Hospital slip or supporting document
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              required
            />
            <span className="field-helper">Accepted file types: PDF, JPG, JPEG, and PNG. This document stays behind authorized backend access.</span>
          </label>
          <div className="form-span form-note">
            <Upload size={14} />
            <span>The hospital slip stays behind authorized access.</span>
          </div>
          <div className="form-span">
            <button className="button button-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
