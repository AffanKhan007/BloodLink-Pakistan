import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import AuthShell from "../../components/AuthShell";
import CityCombobox from "../../components/CityCombobox";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  name: "",
  license_number: "",
  description: "",
  operating_hours: "",
  contact_person_name: "",
  contact_person_cnic: "",
  contact_number: "",
  email: "",
  password: "",
  confirm_password: "",
  city: "",
  area: "",
  address: "",
  latitude: "",
  longitude: "",
  hospital_id: "",
  confirm_accurate: false,
};

const stepFields = [
  ["name", "license_number", "description", "operating_hours"],
  ["contact_person_name", "contact_person_cnic", "contact_number", "email", "password", "confirm_password"],
  ["city", "area", "address"],
  [],
];

function validateField(name, value, form) {
  switch (name) {
    case "name":
      if (!value.trim()) return "Blood bank name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      return "";
    case "license_number":
      if (!value.trim()) return "License number is required.";
      return "";
    case "contact_person_name":
      if (!value.trim()) return "Contact person name is required.";
      return "";
    case "contact_person_cnic":
      if (!value.trim()) return "CNIC is required.";
      if (!/^\d{13}$/.test(value.replace(/-/g, ""))) return "CNIC must be 13 digits.";
      return "";
    case "contact_number":
      if (!value.trim()) return "Phone number is required.";
      if (!/^\d{11}$/.test(value.replace(/^\+/, ""))) return "Phone must be 11 digits.";
      return "";
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
      return "";
    case "password":
      if (!value) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
      return "";
    case "confirm_password":
      if (!value) return "Please confirm your password.";
      if (value !== form.password) return "Passwords do not match.";
      return "";
    case "city":
      if (!value.trim()) return "City is required.";
      return "";
    case "address":
      if (!value.trim()) return "Address is required.";
      return "";
    default:
      return "";
  }
}

export default function RegisterBloodBankPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 4;
  const stepLabels = ["Organization info", "Contact & verification", "Location", "Review & submit"];

  const hasError = (field) => touched[field] && errors[field];

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, form[field], form);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const validateStep = (stepIndex) => {
    const fields = stepFields[stepIndex];
    const newErrors = {};
    let valid = true;
    fields.forEach((key) => {
      const msg = validateField(key, form[key], form);
      if (msg) {
        newErrors[key] = msg;
        valid = false;
      }
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((k) => { next[k] = true; });
      return next;
    });
    return valid;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!form.confirm_accurate) {
      setError("Please confirm the information is accurate.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { confirm_accurate, ...payload } = form;
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude) || null;
      else payload.latitude = null;
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude) || null;
      else payload.longitude = null;
      if (payload.hospital_id) payload.hospital_id = parseInt(payload.hospital_id, 10) || null;
      else payload.hospital_id = null;
      await apiRequest("/api/v1/blood-banks/register", { method: "POST", body: payload });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageTransition>
        <AuthShell title="Registration submitted" description="Your blood bank registration is under review.">
          <div className="content-card" style={{ textAlign: "center" }}>
            <CheckCircle2 size={36} style={{ color: "var(--accent)", marginBottom: "0.75rem" }} />
            <h3>Pending review</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 1.5rem" }}>
              Our team will review your submission and verify your license. You will be able to log in once approved.
            </p>
            <Link className="button button-primary" href="/login">Go to login</Link>
          </div>
        </AuthShell>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthShell
        title="Register your blood bank"
        description="Submit verification details for admin review."
        accent="Blood bank registration"
      >
        <div className="auth-form-header">
          <h2>Step {step + 1} of {totalSteps}</h2>
          <span className="meta-label">{stepLabels[step]}</span>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? "var(--accent)" : "var(--border-subtle)",
              }}
            />
          ))}
        </div>

        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

        {step === 0 && (
          <div className="grid-form">
            <label className={`field-required${hasError("name") ? " field-error" : ""}`}>
              Blood bank name
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onBlur={() => handleBlur("name")} placeholder="City Blood Bank" />
            </label>
            {hasError("name") && <p className="field-error-message">{errors.name}</p>}

            <label className={`field-required${hasError("license_number") ? " field-error" : ""}`}>
              License number
              <input value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} onBlur={() => handleBlur("license_number")} placeholder="BL-12345" />
            </label>
            {hasError("license_number") && <p className="field-error-message">{errors.license_number}</p>}

            <label className="form-span">
              Description
              <textarea rows="3" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="About your blood bank..." />
            </label>

            <label>
              Operating hours
              <input value={form.operating_hours} onChange={(e) => setForm((f) => ({ ...f, operating_hours: e.target.value }))} placeholder="Mon–Sat 9 AM – 6 PM" />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid-form">
            <label className={`field-required${hasError("contact_person_name") ? " field-error" : ""}`}>
              Contact person name
              <input value={form.contact_person_name} onChange={(e) => setForm((f) => ({ ...f, contact_person_name: e.target.value }))} onBlur={() => handleBlur("contact_person_name")} placeholder="Full name" />
            </label>
            {hasError("contact_person_name") && <p className="field-error-message">{errors.contact_person_name}</p>}

            <label className={`field-required${hasError("contact_person_cnic") ? " field-error" : ""}`}>
              Contact person CNIC
              <input value={form.contact_person_cnic} onChange={(e) => setForm((f) => ({ ...f, contact_person_cnic: e.target.value }))} onBlur={() => handleBlur("contact_person_cnic")} placeholder="3520212345678" />
            </label>
            {hasError("contact_person_cnic") && <p className="field-error-message">{errors.contact_person_cnic}</p>}

            <label className={`field-required${hasError("contact_number") ? " field-error" : ""}`}>
              Phone number
              <input value={form.contact_number} onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))} onBlur={() => handleBlur("contact_number")} placeholder="03001234567" />
            </label>
            {hasError("contact_number") && <p className="field-error-message">{errors.contact_number}</p>}

            <label className={`field-required${hasError("email") ? " field-error" : ""}`}>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} onBlur={() => handleBlur("email")} placeholder="info@bloodbank.pk" />
            </label>
            {hasError("email") && <p className="field-error-message">{errors.email}</p>}

            <label className={`field-required${hasError("password") ? " field-error" : ""}`}>
              Password
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} onBlur={() => handleBlur("password")} placeholder="At least 6 characters" />
            </label>
            {hasError("password") && <p className="field-error-message">{errors.password}</p>}

            <label className={`field-required${hasError("confirm_password") ? " field-error" : ""}`}>
              Confirm password
              <input type="password" value={form.confirm_password} onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))} onBlur={() => handleBlur("confirm_password")} placeholder="Re-enter password" />
            </label>
            {hasError("confirm_password") && <p className="field-error-message">{errors.confirm_password}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="grid-form">
            <label className={`field-required city-combo-wrap${hasError("city") ? " field-error" : ""}`}>
              City
              <CityCombobox value={form.city} onChange={(city) => setForm((f) => ({ ...f, city }))} />
            </label>
            {hasError("city") && <p className="field-error-message">{errors.city}</p>}

            <label>
              Area
              <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="Gulberg, DHA, etc." />
            </label>

            <label className={`field-required${hasError("address") ? " field-error" : ""}`}>
              Full address
              <textarea rows="3" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} onBlur={() => handleBlur("address")} placeholder="Complete street address" />
            </label>
            {hasError("address") && <p className="field-error-message">{errors.address}</p>}

            <label>
              Latitude
              <input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="Optional" />
            </label>

            <label>
              Longitude
              <input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="Optional" />
            </label>

            <label>
              Hospital ID
              <input value={form.hospital_id} onChange={(e) => setForm((f) => ({ ...f, hospital_id: e.target.value }))} placeholder="Optional" />
              <span className="field-hint">Link to an existing hospital record if applicable.</span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="grid-form">
            <div className="content-card stacked-cards">
              <h4>Organization</h4>
              <div className="list-row"><span className="meta-label">Name</span><span>{form.name || "—"}</span></div>
              <div className="list-row"><span className="meta-label">License</span><span>{form.license_number || "—"}</span></div>
              {form.description ? <div className="list-row"><span className="meta-label">Description</span><span>{form.description}</span></div> : null}
              {form.operating_hours ? <div className="list-row"><span className="meta-label">Hours</span><span>{form.operating_hours}</span></div> : null}
            </div>
            <div className="content-card stacked-cards">
              <h4>Contact</h4>
              <div className="list-row"><span className="meta-label">Person</span><span>{form.contact_person_name || "—"}</span></div>
              <div className="list-row"><span className="meta-label">CNIC</span><span>{form.contact_person_cnic || "—"}</span></div>
              <div className="list-row"><span className="meta-label">Phone</span><span>{form.contact_number || "—"}</span></div>
              <div className="list-row"><span className="meta-label">Email</span><span>{form.email || "—"}</span></div>
            </div>
            <div className="content-card stacked-cards">
              <h4>Location</h4>
              <div className="list-row"><span className="meta-label">City</span><span>{form.city || "—"}</span></div>
              {form.area ? <div className="list-row"><span className="meta-label">Area</span><span>{form.area}</span></div> : null}
              <div className="list-row"><span className="meta-label">Address</span><span>{form.address || "—"}</span></div>
              {form.latitude ? <div className="list-row"><span className="meta-label">Lat</span><span>{form.latitude}</span></div> : null}
              {form.longitude ? <div className="list-row"><span className="meta-label">Lng</span><span>{form.longitude}</span></div> : null}
              {form.hospital_id ? <div className="list-row"><span className="meta-label">Hospital ID</span><span>{form.hospital_id}</span></div> : null}
            </div>

            <label className="checkbox-row form-span">
              <input type="checkbox" checked={form.confirm_accurate} onChange={(e) => setForm((f) => ({ ...f, confirm_accurate: e.target.checked }))} required />
              <span>I confirm the information is accurate</span>
            </label>
          </div>
        )}

        <div className="auth-form" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          {step > 0 ? (
            <button type="button" className="button button-secondary" onClick={handleBack}>
              <ArrowLeft size={14} /> Back
            </button>
          ) : null}
          {step < totalSteps - 1 ? (
            <button type="button" className="button button-primary" onClick={handleNext} style={{ flex: 1 }}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" className="button button-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 1 }}>
              {submitting ? <><LoaderCircle size={14} className="spin-icon" /> Submitting...</> : <>Submit registration <ArrowRight size={14} /></>}
            </button>
          )}
        </div>

        <p className="form-footer">
          Already registered? <Link href="/login">Login</Link>
        </p>
      </AuthShell>
    </PageTransition>
  );
}
