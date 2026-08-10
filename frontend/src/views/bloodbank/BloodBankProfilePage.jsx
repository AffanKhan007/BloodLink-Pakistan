import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

export default function BloodBankProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/v1/blood-banks/me", { token })
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          operating_hours: data.operating_hours || "",
          description: data.description || "",
          contact_number: data.contact_number || "",
          email: data.email || "",
          address: data.address || "",
          city: data.city || "",
          area: data.area || "",
          public_stock_visible: data.public_stock_visible ?? true,
          accepts_walkins: data.accepts_walkins ?? true,
        });
      })
      .catch(() => {});
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/v1/blood-banks/me", {
        method: "PATCH",
        token,
        body: form,
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!profile || !form) return <LoadingState label="Loading profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Settings"
          title="Blood bank profile"
          description="Update your blood bank's public information and preferences."
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
          <label className="field-required">
            Name
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </label>
          <label>
            Operating hours
            <input value={form.operating_hours} onChange={(e) => setForm((prev) => ({ ...prev, operating_hours: e.target.value }))} />
          </label>
          <label className="form-span">
            Description
            <textarea rows="3" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>
          <label className="field-required">
            Contact number
            <input value={form.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, contact_number: e.target.value }))} required />
          </label>
          <label className="field-required">
            Email
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </label>
          <label className="form-span">
            Address
            <input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
          </label>
          <label className="field-required">
            City
            <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} required />
          </label>
          <label>
            Area
            <input value={form.area} onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.public_stock_visible}
              onChange={(e) => setForm((prev) => ({ ...prev, public_stock_visible: e.target.checked }))}
            />{" "}
            Public stock visible
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.accepts_walkins}
              onChange={(e) => setForm((prev) => ({ ...prev, accepts_walkins: e.target.checked }))}
            />{" "}
            Accepts walk-ins
          </label>
          <div className="form-span">
            <button className="button button-primary">Save changes</button>
          </div>
        </form>
      </section>
    </div>
  );
}
