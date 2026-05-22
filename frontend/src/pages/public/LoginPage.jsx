import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "super_admin" || role === "operations_agent") return "/admin";
  if (role === "hospital_admin" || role === "hospital_staff") return "/hospital";
  if (role === "blood_bank_admin" || role === "blood_bank_staff") return "/blood-bank";
  if (role === "institution_donor") return "/institution";
  if (role === "receiver") return "/receiver";
  return "/donor";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
    <AuthShell title="Welcome back" description="Sign in to continue to your BloodLink workspace." accent="Login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Login</h2>
          <p>Use your account credentials to continue.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label className="field-required">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
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
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="form-footer">
        Need an account? <Link to="/register">Register here</Link>
      </p>
    </AuthShell>
  );
}
