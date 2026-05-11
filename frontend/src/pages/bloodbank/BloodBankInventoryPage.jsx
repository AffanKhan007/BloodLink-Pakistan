import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";
import StatCard from "../../components/StatCard";

const initialForm = {
  donor_profile_id: "",
  blood_group: "A+",
  component_type: "whole_blood",
  collected_at: "",
  expires_at: "",
  testing_status: "pending",
  status: "collected",
  storage_location: "",
};

export default function BloodBankInventoryPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSummary = async () => {
    if (!user?.blood_bank_id) return;
    const data = await apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/inventory-summary`, { token });
    setSummary(data);
  };

  useEffect(() => {
    loadSummary();
  }, [token, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/blood-units`, {
        method: "POST",
        token,
        body: {
          ...form,
          donor_profile_id: form.donor_profile_id ? Number(form.donor_profile_id) : null,
          collected_at: new Date(form.collected_at).toISOString(),
          expires_at: new Date(form.expires_at).toISOString(),
        },
      });
      setMessage("Blood unit created.");
      setForm(initialForm);
      await loadSummary();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (!user?.blood_bank_id) {
    return <EmptyState title="No blood bank scope" description="This staff account is not assigned to a blood bank yet." />;
  }
  if (!summary) return <LoadingState label="Loading blood bank inventory" />;

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Blood bank" value={summary.blood_bank.name} helper={summary.blood_bank.city} />
        <StatCard label="Total units" value={summary.total_units} helper="Tracked inventory" />
        <StatCard label="Available" value={summary.available_units} helper="Ready for coordination" />
        <StatCard label="Expiring soon" value={summary.expiring_soon_units} helper="Within 7 days" />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inventory intake</p>
            <h2>Create blood unit</h2>
          </div>
        </div>
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
          <label>
            Donor profile ID
            <input value={form.donor_profile_id} onChange={(event) => setForm((current) => ({ ...current, donor_profile_id: event.target.value }))} />
          </label>
          <label>
            Blood group
            <select value={form.blood_group} onChange={(event) => setForm((current) => ({ ...current, blood_group: event.target.value }))}>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label>
            Component type
            <input value={form.component_type} onChange={(event) => setForm((current) => ({ ...current, component_type: event.target.value }))} required />
          </label>
          <label>
            Collected at
            <input type="datetime-local" value={form.collected_at} onChange={(event) => setForm((current) => ({ ...current, collected_at: event.target.value }))} required />
          </label>
          <label>
            Expires at
            <input type="datetime-local" value={form.expires_at} onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))} required />
          </label>
          <label>
            Testing status
            <select value={form.testing_status} onChange={(event) => setForm((current) => ({ ...current, testing_status: event.target.value }))}>
              {["pending", "cleared", "failed", "inconclusive"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {["collected", "testing_pending", "cleared", "available", "reserved"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Storage location
            <input value={form.storage_location} onChange={(event) => setForm((current) => ({ ...current, storage_location: event.target.value }))} />
          </label>
          <div className="form-span">
            <button className="button button-primary">Create blood unit</button>
          </div>
        </form>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tracked units</p>
            <h2>Inventory overview</h2>
          </div>
        </div>
        {summary.units.length === 0 ? (
          <EmptyState title="No units yet" description="Create blood units to begin inventory traceability." />
        ) : (
          <div className="stacked-cards">
            {summary.units.map((unit) => (
              <div className="info-card" key={unit.id}>
                <div className="list-row">
                  <div>
                    <strong>{unit.unit_code}</strong>
                    <p>
                      {unit.blood_group} • {unit.component_type}
                    </p>
                  </div>
                  <StatusBadge value={unit.status} />
                </div>
                <div className="card-actions">
                  <StatusBadge value={unit.testing_status} />
                  <Link className="button button-secondary" to={`/blood-bank/units/${unit.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

