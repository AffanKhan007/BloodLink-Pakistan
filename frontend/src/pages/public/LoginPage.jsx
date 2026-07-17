import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  if (role === "member") return "/dashboard";
  if (role === "admin") return "/admin";
  if (role === "super_admin" || role === "operations_agent") return "/admin";
  if (role === "hospital_admin" || role === "hospital_staff") return "/hospital";
  if (role === "blood_bank_admin" || role === "blood_bank_staff") return "/blood-bank";
  if (role === "institution_donor") return "/institution";
  return "/dashboard";
}

function validateIdentifier(value) {
  if (!value.trim()) return "Email or phone is required.";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\d{10,15}$/;
  if (!emailPattern.test(value) && !phonePattern.test(value.replace(/^\+/, ""))) {
    return "Enter a valid email or phone number.";
  }
  return "";
}

function validatePassword(value) {
  if (!value) return "Password is required.";
  return "";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    newErrors.identifier = validateIdentifier(form.identifier);
    newErrors.password = validatePassword(form.password);
    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = field === "identifier"
      ? validateIdentifier(form[field])
      : validatePassword(form[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ identifier: true, password: true });
    if (Object.keys(validationErrors).length > 0) return;
    setSubmitting(true);
    try {
      const user = await login(form);
      addToast({ message: "Login successful", type: "success" });
      navigate(destinationForRole(user.role));
    } catch (submitError) {
      setError(submitError.message);
      addToast({ message: submitError.message || "Login failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const hasError = (field) => touched[field] && errors[field];

  return (
    <PageTransition>
    <AuthShell title="Welcome back" description="Sign in to your BloodLink account." accent="Login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Login</h2>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label className={`field-required${hasError("identifier") ? " field-error" : ""}`}>
          Email or phone
          <input
            value={form.identifier}
            onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
            onBlur={() => handleBlur("identifier")}
            placeholder="you@example.com or +923001234567"
          />
        </label>
        {hasError("identifier") && <p className="field-error-message">{errors.identifier}</p>}
        <label className={`field-required${hasError("password") ? " field-error" : ""}`}>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            onBlur={() => handleBlur("password")}
            placeholder="Enter your password"
          />
        </label>
        {hasError("password") && <p className="field-error-message">{errors.password}</p>}
        <div className="auth-inline-actions">
          <Link className="text-link" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
          <ArrowRight size={14} />
        </button>
      </form>
      <p className="form-footer">
        Need an account? <Link to="/register">Register here</Link>
      </p>
    </AuthShell>
    </PageTransition>
  );
}
