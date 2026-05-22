import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

const initialForm = {
  institution_name: "",
  institution_type: "",
  city: "",
  area: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  available_blood_groups: "",
  notes: "",
};

export default function InstitutionProfilePage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ ...initialForm, email: user?.email || "", phone: user?.phone || "", contact_person: user?.full_name || "" });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/institutions/me", { token }).catch(() => null), apiRequest("/cities").catch(() => [])])
      .then(([profile, cityData]) => {
        setCities(cityData);
        if (profile) {
          setForm({ ...initialForm, ...profile });
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/institutions/me", { method: "POST", token, body: form });
      setMessage("Institution profile saved.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading institution profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution profile"
          title="Organization details"
          description="Publish your institution donor profile so receivers can discover and contact your organization for support."
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
          {Object.entries({
            institution_name: "Institution name",
            institution_type: "Institution type",
            city: "City",
            area: "Area",
            contact_person: "Contact person",
            email: "Email",
            phone: "Phone",
            address: "Address",
            available_blood_groups: "Available blood groups",
            notes: "Notes",
          }).map(([field, label]) => (
            <label key={field} className={field === "address" || field === "notes" ? "form-span" : undefined}>
              {label}
              {field === "city" ? (
                <select value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} required>
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : field === "address" || field === "notes" ? (
                <textarea rows="3" value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              ) : (
                <input value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} required={field !== "area" && field !== "available_blood_groups"} />
              )}
            </label>
          ))}
          <div className="form-span">
            <button className="button button-primary">Save institution profile</button>
          </div>
        </form>
      </section>
    </div>
  );
}
