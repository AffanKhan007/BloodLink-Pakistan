import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import CityCombobox from "../../components/CityCombobox";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

const institutionTypes = ["Hospital", "Blood Bank", "NGO/Welfare Organization", "Blood Donor Society", "Educational Institution", "Other"];

const initialForm = {
  institution_name: "",
  institution_type: "Hospital",
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
  confirm_authorized: false,
};

export default function RegisterInstitutionPage() {
  const navigate = useNavigate();
  const { registerInstitution } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [proofDocument, setProofDocument] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (!proofDocument) {
      setError("Proof document is required.");
      return;
    }
    if (!form.confirm_authorized) {
      setError("Please confirm you are authorized to register this institution.");
      return;
    }
    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = form;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, typeof value === "boolean" ? String(value) : value || "");
      });
      formData.append("proof_document", proofDocument);
      await registerInstitution(formData);
      navigate("/institution");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
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
          <select value={form.institution_type} onChange={(event) => setForm((current) => ({ ...current, institution_type: event.target.value }))} required>
            {institutionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field-required city-combo-wrap">
          City
          <CityCombobox value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} required />
        </label>
        <label className="field-required">
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} placeholder="Gulberg, Model Town, New Campus" required />
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
        <label className="field-required">
          Proof document
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setProofDocument(event.target.files?.[0] || null)} required />
          <span className="field-hint">Upload a registration certificate, license, or official proof document.</span>
        </label>
        <label className="checkbox-row form-span">
          <input
            type="checkbox"
            checked={form.confirm_authorized}
            onChange={(event) => setForm((current) => ({ ...current, confirm_authorized: event.target.checked }))}
            required
          />
          <span>I confirm this information is accurate and I am authorized to register on behalf of this organization</span>
        </label>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Submitting..." : "Register institution"}
          <ArrowRight size={14} />
        </button>
      </form>
      <p className="form-footer">
        Registering as an individual? <Link to="/register">Go to donor / receiver signup</Link>
      </p>
      <p className="form-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthShell>
    </PageTransition>
  );
}
