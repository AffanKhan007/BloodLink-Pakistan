import { useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "super_admin" || role === "operations_agent") return "/admin";
  if (role === "hospital_admin" || role === "hospital_staff") return "/hospital";
  if (role === "blood_bank_admin" || role === "blood_bank_staff") return "/blood-bank/inventory";
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
    <AuthShell title="Secure sign in for every workspace" description="Access donor, receiver, admin, hospital, or blood bank operations through a calmer, modern healthcare UI." accent="Access your workspace">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <span className="eyebrow eyebrow-inline">
            <KeyRound size={14} />
            Secure access
          </span>
          <h2>Login</h2>
          <p>Use your existing BloodLink account to continue.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>
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
