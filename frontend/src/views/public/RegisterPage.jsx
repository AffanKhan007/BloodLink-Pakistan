import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name, value, form) {
  switch (name) {
    case "full_name":
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
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
    setTouched({ full_name: true, email: true, phone: true, password: true, confirm_password: true });
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = form;
      const user = await register(payload);
      addToast({ message: "Account created successfully", type: "success" });
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
      addToast({ message: submitError.message || "Registration failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const hasError = (field) => touched[field] && errors[field];

  return (
    <PageTransition>
    <AuthShell title="Create your account" description="Create a free account to get started." accent="Register">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Register</h2>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

        <div className="inline-note-card">
          <Building2 size={15} />
          <div>
            <strong>Registering an institution?</strong>
            <p>Organizations use a separate verification form before they appear publicly.</p>
            <Link className="text-link" href="/register/institution">
              Open institution registration
            </Link>
          </div>
        </div>

        <label className={`field-required${hasError("full_name") ? " field-error" : ""}`}>
          Full name
          <input
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            onBlur={() => handleBlur("full_name")}
            placeholder="Your full name"
          />
        </label>
        {hasError("full_name") && <p className="field-error-message">{errors.full_name}</p>}
        <label className={`field-required${hasError("email") ? " field-error" : ""}`}>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            onBlur={() => handleBlur("email")}
            placeholder="you@example.com"
          />
        </label>
        {hasError("email") && <p className="field-error-message">{errors.email}</p>}
        <label className={`field-required${hasError("phone") ? " field-error" : ""}`}>
          Phone
          <input
            placeholder="+923001234567"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            onBlur={() => handleBlur("phone")}
          />
        </label>
        {hasError("phone") && <p className="field-error-message">{errors.phone}</p>}
        <label className={`field-required${hasError("password") ? " field-error" : ""}`}>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            onBlur={() => handleBlur("password")}
            placeholder="At least 8 characters with letters and numbers"
          />
        </label>
        {hasError("password") && <p className="field-error-message">{errors.password}</p>}
        <label className={`field-required${hasError("confirm_password") ? " field-error" : ""}`}>
          Confirm password
          <input
            type="password"
            value={form.confirm_password}
            onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
            onBlur={() => handleBlur("confirm_password")}
            placeholder="Re-enter your password"
          />
        </label>
        {hasError("confirm_password") && <p className="field-error-message">{errors.confirm_password}</p>}
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
          <ArrowRight size={14} />
        </button>
      </form>
      <p className="form-footer">
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </AuthShell>
    </PageTransition>
  );
}
