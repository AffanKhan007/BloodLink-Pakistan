import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  if (role === "user") return "/dashboard";
  if (role === "admin") return "/admin";
  if (role === "super_admin" || role === "operations_agent") return "/admin";
  if (role === "hospital_admin" || role === "hospital_staff") return "/hospital";
  if (role === "blood_bank_admin" || role === "blood_bank_staff") return "/blood-bank";
  if (role === "institution_donor") return "/institution";
  return "/dashboard";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(destinationForRole(user.role));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
    <AuthShell title="Welcome back" description="Sign in to continue to your BloodLink workspace." accent="Login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Login</h2>
          <p>Use your account credentials to continue.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label className="field-required">
          Email or phone
          <input
            value={form.identifier}
            onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
            placeholder="you@example.com or +923001234567"
            required
          />
        </label>
        <label className="field-required">
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Enter your password"
            required
          />
        </label>
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
