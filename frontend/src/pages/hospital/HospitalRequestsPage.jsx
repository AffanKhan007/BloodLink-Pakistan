import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";

const initialForm = {
  patient_name: "",
  blood_group_needed: "A+",
  units_required: 1,
  ward_room: "",
  urgency_level: "high",
  attendant_name: "",
  attendant_phone: "",
  required_by: "",
};

export default function HospitalRequestsPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    if (!user?.hospital_id) return;
    const data = await apiRequest(`/api/v1/hospitals/${user.hospital_id}/dashboard`, { token });
    setRequests(data.requests);
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      attendant_name: current.attendant_name || user?.full_name || "",
      attendant_phone: current.attendant_phone || user?.phone || "",
    }));
    loadDashboard().finally(() => setLoading(false));
  }, [token, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/hospitals/${user.hospital_id}/requests`, {
        method: "POST",
        token,
        body: {
          ...form,
          required_by: new Date(form.required_by).toISOString(),
        },
      });
      setMessage("Hospital request created successfully.");
      setForm({
        ...initialForm,
        attendant_name: user?.full_name || "",
        attendant_phone: user?.phone || "",
      });
      await loadDashboard();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (!user?.hospital_id) {
    return <EmptyState title="No hospital scope" description="This staff account is not assigned to a hospital yet." />;
  }
  if (loading) return <LoadingState label="Loading hospital requests" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Verified request intake</p>
            <h2>Create hospital request</h2>
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
            <button className="button button-primary">Create hospital request</button>
          </div>
        </form>
      </section>
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hospital queue</p>
            <h2>Recent hospital requests</h2>
          </div>
        </div>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Hospital-created requests will appear here." />
        ) : (
          <div className="card-list">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

