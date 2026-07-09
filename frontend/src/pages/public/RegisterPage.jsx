import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";
import { AlertMessage } from "../../components/PageState";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const user = await register(payload);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
    <AuthShell title="Create your account" description="Set up a BloodLink account and start using the platform." accent="Register">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Register</h2>
          <p>Create your account with the details you will use to sign in.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}

        <div className="inline-note-card">
          <Building2 size={15} />
          <div>
            <strong>Registering an institution?</strong>
            <p>Organizations use a separate verification form before they appear publicly.</p>
            <Link className="text-link" to="/register/institution">
              Open institution registration
            </Link>
          </div>
        </div>

        <label className="field-required">
          Full name
          <input
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Your full name"
            required
          />
        </label>
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
          Phone
          <input
            placeholder="+923001234567"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            required
          />
        </label>
        <label className="field-required">
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            minLength={8}
            placeholder="At least 8 characters with letters and numbers"
            required
          />
        </label>
        <label className="field-required">
          Confirm password
          <input
            type="password"
            value={form.confirm_password}
            onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
            placeholder="Re-enter your password"
            required
          />
        </label>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
          <ArrowRight size={14} />
        </button>
      </form>
      <p className="form-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthShell>
    </PageTransition>
  );
}
