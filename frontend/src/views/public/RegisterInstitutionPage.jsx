import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import CityCombobox from "../../components/CityCombobox";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

const institutionTypes = ["Hospital", "Blood Bank", "NGO/Welfare Organization", "Blood Donor Society", "Educational Institution", "Other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name, value, form) {
  switch (name) {
    case "institution_name":
      if (!value.trim()) return "Institution name is required.";
      return "";
    case "city":
      if (!value.trim()) return "City is required.";
      return "";
    case "address":
      if (!value.trim()) return "Full address is required.";
      return "";
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required.";
      if (!/^\d{11}$/.test(value.replace(/^\+/, ""))) return "Phone must be 11 digits.";
      return "";
    case "password":
      if (!value) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
      return "";
    case "confirm_password":
      if (!value) return "Please confirm your password.";
      if (value !== form.password) return "Passwords do not match.";
      return "";
    default:
      return "";
  }
}

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
  const router = useRouter();
  const { registerInstitution } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [proofDocument, setProofDocument] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validateAll = () => {
    const newErrors = {};
    ["institution_name", "city", "address", "email", "phone", "password", "confirm_password"].forEach((key) => {
      const msg = validateField(key, form[key], form);
      if (msg) newErrors[key] = msg;
    });
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, form[field], form);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) {
        next[field] = msg;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const validationErrors = validateAll();
    setErrors(validationErrors);
    setTouched((prev) => {
      const next = { ...prev };
      ["institution_name", "city", "address", "email", "phone", "password", "confirm_password"].forEach((k) => { next[k] = true; });
      return next;
    });
    if (Object.keys(validationErrors).length > 0) return;
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
      router.push("/institution");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasError = (field) => touched[field] && errors[field];

  return (
    <PageTransition>
    <AuthShell
      title="Register your institution"
      description="Submit verification details for admin review before public listing."
      accent="Institution registration"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Institution registration</h2>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

        <label className={`field-required${hasError("institution_name") ? " field-error" : ""}`}>
          Institution name
          <input value={form.institution_name} onChange={(event) => setForm((current) => ({ ...current, institution_name: event.target.value }))} onBlur={() => handleBlur("institution_name")} placeholder="Punjab University Donor Desk" />
        </label>
        {hasError("institution_name") && <p className="field-error-message">{errors.institution_name}</p>}
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
        <label className={`field-required city-combo-wrap${hasError("city") ? " field-error" : ""}`}>
          City
          <CityCombobox value={form.city} onChange={(city) => setForm((current) => ({ ...current, city }))} />
        </label>
        {hasError("city") && <p className="field-error-message">{errors.city}</p>}
        <label className="field-required">
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} placeholder="Gulberg, Model Town, New Campus" required />
        </label>
        <label className={`field-required${hasError("address") ? " field-error" : ""}`}>
          Full address
          <textarea rows="3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} onBlur={() => handleBlur("address")} placeholder="Full institution address" />
        </label>
        {hasError("address") && <p className="field-error-message">{errors.address}</p>}
        <label className="field-required">
          Contact person name
          <input value={form.contact_person} onChange={(event) => setForm((current) => ({ ...current, contact_person: event.target.value }))} placeholder="Responsible coordinator" required />
        </label>
        <label className="field-required">
          Contact person designation
          <input value={form.contact_person_designation} onChange={(event) => setForm((current) => ({ ...current, contact_person_designation: event.target.value }))} placeholder="Program lead, CSR manager, volunteer coordinator" required />
        </label>
        <label className={`field-required${hasError("email") ? " field-error" : ""}`}>
          Official email
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} onBlur={() => handleBlur("email")} placeholder="contact@institution.pk" />
        </label>
        {hasError("email") && <p className="field-error-message">{errors.email}</p>}
        <label className={`field-required${hasError("phone") ? " field-error" : ""}`}>
          Phone number
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} onBlur={() => handleBlur("phone")} placeholder="+923001234567" />
        </label>
        {hasError("phone") && <p className="field-error-message">{errors.phone}</p>}
        <label className={`field-required${hasError("password") ? " field-error" : ""}`}>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} onBlur={() => handleBlur("password")} placeholder="At least 8 characters with letters and numbers" />
        </label>
        {hasError("password") && <p className="field-error-message">{errors.password}</p>}
        <label className={`field-required${hasError("confirm_password") ? " field-error" : ""}`}>
          Confirm password
          <input type="password" value={form.confirm_password} onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))} onBlur={() => handleBlur("confirm_password")} placeholder="Re-enter your password" />
        </label>
        {hasError("confirm_password") && <p className="field-error-message">{errors.confirm_password}</p>}
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
          <span>I am authorized to register this institution and confirm the information is accurate</span>
        </label>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Submitting..." : "Register institution"}
          <ArrowRight size={14} />
        </button>
      </form>
      <p className="form-footer">
        Registering as an individual? <Link href="/register">Go to member signup</Link>
      </p>
      <p className="form-footer">
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </AuthShell>
    </PageTransition>
  );
}
