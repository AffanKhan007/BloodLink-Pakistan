import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage } from "../../components/PageState";

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
};

export default function CreateRequestPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...initialForm, attendant_name: user?.full_name || "", attendant_phone: user?.phone || "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        required_by: new Date(form.required_by).toISOString(),
      };
      const request = await apiRequest("/requests", { method: "POST", token, body: payload });
      setMessage("Request submitted and sent for admin review.");
      navigate(`/receiver/requests/${request.id}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Receiver workflow</p>
          <h2>Create blood request</h2>
        </div>
      </div>
      {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      <form className="grid-form" onSubmit={handleSubmit}>
        <label>
          Patient name
          <input value={form.patient_name} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} required />
        </label>
        <label>
          Blood group needed
          <select value={form.blood_group_needed} onChange={(event) => setForm((current) => ({ ...current, blood_group_needed: event.target.value }))}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Units required
          <input type="number" min="1" value={form.units_required} onChange={(event) => setForm((current) => ({ ...current, units_required: Number(event.target.value) }))} required />
        </label>
        <label>
          Hospital name
          <input value={form.hospital_name} onChange={(event) => setForm((current) => ({ ...current, hospital_name: event.target.value }))} required />
        </label>
        <label>
          City
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required />
        </label>
        <label>
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
        </label>
        <label>
          Ward / room
          <input value={form.ward_room} onChange={(event) => setForm((current) => ({ ...current, ward_room: event.target.value }))} required />
        </label>
        <label>
          Urgency
          <select value={form.urgency_level} onChange={(event) => setForm((current) => ({ ...current, urgency_level: event.target.value }))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          Required by
          <input type="datetime-local" value={form.required_by} onChange={(event) => setForm((current) => ({ ...current, required_by: event.target.value }))} required />
        </label>
        <label>
          Attendant name
          <input value={form.attendant_name} onChange={(event) => setForm((current) => ({ ...current, attendant_name: event.target.value }))} required />
        </label>
        <label>
          Attendant phone
          <input value={form.attendant_phone} onChange={(event) => setForm((current) => ({ ...current, attendant_phone: event.target.value }))} required />
        </label>
        <div className="form-span">
          <button className="button button-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}

