import { Calendar, Clock, MapPin, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

const initialForm = {
  title: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  location_address: "",
  city: "",
  target_blood_groups: "",
  expected_capacity: 50,
};

export default function BloodBankDrivesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDrives = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/blood-banks/me/drives", { token });
      setDrives(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/v1/blood-banks/me/drives", {
        method: "POST",
        token,
        body: {
          ...form,
          expected_capacity: Number(form.expected_capacity),
          target_blood_groups: form.target_blood_groups
            ? form.target_blood_groups.split(",").map((s) => s.trim())
            : [],
        },
      });
      setMessage("Drive created successfully.");
      setForm(initialForm);
      setFormOpen(false);
      await loadDrives();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async (driveId, status) => {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/blood-banks/me/drives/${driveId}`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setMessage(`Drive marked as ${status}.`);
      await loadDrives();
    } catch (err) {
      setError(err.message);
    }
  };

  const statusActions = (drive) => {
    const buttons = [];
    if (drive.status !== "active") buttons.push({ label: "Mark Active", status: "active" });
    if (drive.status !== "completed") buttons.push({ label: "Mark Completed", status: "completed" });
    if (drive.status !== "cancelled") buttons.push({ label: "Mark Cancelled", status: "cancelled" });
    return buttons;
  };

  if (loading) return <LoadingState label="Loading donation drives" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Donation drives"
          title="Manage drives"
          description="Organize and track blood donation drives in your city."
          actions={
            <button className="button button-primary" onClick={() => setFormOpen((prev) => !prev)}>
              <Plus size={14} /> Create drive
            </button>
          }
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>

      {formOpen && (
        <section className="content-card">
          <SectionIntro eyebrow="New drive" title="Create donation drive" description="Fill in the details to schedule a new drive." compact />
          <form className="grid-form" onSubmit={handleCreate}>
            <label className="field-required">
              Title
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
            </label>
            <label>
              Description
              <textarea rows="3" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </label>
            <label className="field-required">
              Event date
              <input type="date" value={form.event_date} onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))} required />
            </label>
            <label className="field-required">
              Start time
              <input type="time" value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} required />
            </label>
            <label className="field-required">
              End time
              <input type="time" value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} required />
            </label>
            <label className="field-required">
              Location address
              <input value={form.location_address} onChange={(e) => setForm((prev) => ({ ...prev, location_address: e.target.value }))} required />
            </label>
            <label className="field-required">
              City
              <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} required />
            </label>
            <label>
              Target blood groups (comma-separated)
              <input value={form.target_blood_groups} onChange={(e) => setForm((prev) => ({ ...prev, target_blood_groups: e.target.value }))} placeholder="A+, B+, O-" />
            </label>
            <label>
              Expected capacity
              <input type="number" min="1" value={form.expected_capacity} onChange={(e) => setForm((prev) => ({ ...prev, expected_capacity: e.target.value }))} />
            </label>
            <div className="form-span">
              <button className="button button-primary">Create drive</button>
            </div>
          </form>
        </section>
      )}

      {drives.length === 0 ? (
        <EmptyState title="No drives yet" description="Create your first donation drive to get started." />
      ) : (
        <div className="card-list">
          {drives.map((drive) => (
            <div className="info-card" key={drive.id}>
              <div className="list-row">
                <div>
                  <strong>{drive.title}</strong>
                  <p>{drive.city}</p>
                </div>
                <StatusBadge value={drive.status} />
              </div>
              <div className="inline-metrics">
                <span><Calendar size={12} /> {drive.event_date ? new Date(drive.event_date).toLocaleDateString() : "TBD"}</span>
                {drive.start_time && <span><Clock size={12} /> {drive.start_time} - {drive.end_time}</span>}
                <span><MapPin size={12} /> {drive.location_address}</span>
                <span><Users size={12} /> {(drive.registrations || []).length} / {drive.expected_capacity} registered</span>
              </div>
              <div className="card-actions">
                {statusActions(drive).map((btn) => (
                  <button key={btn.status} className="button button-tertiary" onClick={() => handleStatusUpdate(drive.id, btn.status)}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
