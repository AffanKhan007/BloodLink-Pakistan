import { Droplets, HeartPulse, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

const initialForm = {
  blood_group: "A+",
  city: "",
  area: "",
  age: 18,
  gender: "",
  last_donation_date: "",
  availability_status: "available",
  health_notes: "",
};

export default function DonorProfilePage() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/donors/profile/me", { token })
      .then((profile) => {
        setForm({
          ...profile,
          last_donation_date: profile.last_donation_date || "",
          health_notes: profile.health_notes || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/donors/profile", {
        method: "POST",
        token,
        body: { ...form, last_donation_date: form.last_donation_date || null },
      });
      setMessage("Profile saved successfully.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading donor profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Donor setup"
          title="My profile"
          description="Keep your blood group, location, and availability up to date so the matching logic can surface the right requests."
        />
        <div className="metrics-strip">
          <div className="metric-chip">
            <MapPin size={16} />
            <div>
              <span>Coverage area</span>
              <strong>{form.city || "Add city"} {form.area ? `/ ${form.area}` : ""}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <Droplets size={16} />
            <div>
              <span>Blood group</span>
              <strong>{form.blood_group}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <ShieldCheck size={16} />
            <div>
              <span>Availability</span>
              <strong>{form.availability_status}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <HeartPulse size={16} />
            <div>
              <span>Health note</span>
              <strong>{form.health_notes ? "Added" : "Optional"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card">
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
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
          City
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required />
        </label>
        <label>
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
        </label>
        <label>
          Age
          <input type="number" min="18" max="65" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) }))} required />
        </label>
        <label>
          Gender
          <input value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} required />
        </label>
        <label>
          Last donation date
          <input
            type="date"
            value={form.last_donation_date}
            onChange={(event) => setForm((current) => ({ ...current, last_donation_date: event.target.value }))}
          />
        </label>
        <label>
          Availability
          <select
            value={form.availability_status}
            onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.value }))}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label className="form-span">
          Health notes
          <textarea
            rows="4"
            value={form.health_notes}
            onChange={(event) => setForm((current) => ({ ...current, health_notes: event.target.value }))}
          />
        </label>
          <div className="form-span form-actions-row">
            <button className="button button-primary">Save profile</button>
          </div>
        </form>
      </section>
    </div>
  );
}
