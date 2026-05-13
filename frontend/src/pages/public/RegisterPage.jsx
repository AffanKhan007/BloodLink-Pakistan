import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  return role === "receiver" ? "/receiver" : "/donor";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "donor",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(destinationForRole(user.role));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create a BloodLink account" description="Join as a donor or receiver and move through a safer, more professional blood coordination workflow." accent="New account setup">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <span className="eyebrow eyebrow-inline">
            <UserPlus size={14} />
            Simple onboarding
          </span>
          <h2>Register</h2>
          <p>Create a donor or receiver account for the MVP.</p>
        </div>
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <label>
          Full name
          <input
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
            required
          />
        </label>
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
          Phone
          <input
            placeholder="+923001234567"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            minLength={8}
            required
          />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="donor">Donor</option>
            <option value="receiver">Receiver / Patient Attendant</option>
          </select>
        </label>
        <button className="button button-primary button-full button-with-icon" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="form-footer">
        Already registered? <Link to="/login">Login here</Link>
      </p>
    </AuthShell>
  );
}
