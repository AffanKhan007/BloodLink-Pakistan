import { ArrowRight, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import { AlertMessage } from "../../components/PageState";

const initialForm = {
  institution_name: "",
  institution_type: "",
  city: "",
  area: "",
  address: "",
  contact_person: "",
  contact_person_designation: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  website_social_link: "",
  proof_document_url: "",
};

export default function RegisterInstitutionPage() {
  const navigate = useNavigate();
  const { registerInstitution } = useAuth();
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest("/cities").then(setCities).catch(() => setCities([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = form;
      await registerInstitution(payload);
      navigate("/institution");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Register your institution"
      description="Submit organization verification details so BloodLink can review your institution before public visibility."
      accent="Institution registration"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Institution registration</h2>
          <p>Institutions can sign in immediately, but directory visibility and messaging stay locked until admin approval.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

        <label className="field-required">
          Institution name
          <input value={form.institution_name} onChange={(event) => setForm((current) => ({ ...current, institution_name: event.target.value }))} placeholder="Punjab University Donor Desk" required />
        </label>
        <label className="field-required">
          Institution type
          <input value={form.institution_type} onChange={(event) => setForm((current) => ({ ...current, institution_type: event.target.value }))} placeholder="University, company, NGO, government office" required />
        </label>
        <label className="field-required">
          City
          <select value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required>
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} placeholder="Gulberg, Model Town, New Campus" />
        </label>
        <label className="field-required">
          Full address
          <textarea rows="3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Full institution address" required />
        </label>
        <label className="field-required">
          Contact person name
          <input value={form.contact_person} onChange={(event) => setForm((current) => ({ ...current, contact_person: event.target.value }))} placeholder="Responsible coordinator" required />
        </label>
        <label className="field-required">
          Contact person designation
          <input value={form.contact_person_designation} onChange={(event) => setForm((current) => ({ ...current, contact_person_designation: event.target.value }))} placeholder="Program lead, CSR manager, volunteer coordinator" required />
        </label>
        <label className="field-required">
          Official email
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="contact@institution.pk" required />
        </label>
        <label className="field-required">
          Phone number
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+923001234567" required />
        </label>
        <label className="field-required">
          Password
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} minLength={8} placeholder="At least 8 characters with letters and numbers" required />
        </label>
        <label className="field-required">
          Confirm password
          <input type="password" value={form.confirm_password} onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))} placeholder="Re-enter your password" required />
        </label>
        <label>
          Website or social link
          <input value={form.website_social_link} onChange={(event) => setForm((current) => ({ ...current, website_social_link: event.target.value }))} placeholder="https://yourinstitution.pk" />
        </label>
        <label>
          Proof document link
          <input value={form.proof_document_url} onChange={(event) => setForm((current) => ({ ...current, proof_document_url: event.target.value }))} placeholder="Optional document URL or hosted file link" />
        </label>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Submitting..." : "Register institution"}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="form-footer">
        Registering as an individual? <Link to="/register">Go to donor / receiver signup</Link>
      </p>
      <p className="form-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthShell>
  );
}
