import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
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
    <div className="auth-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>Register</h1>
        <p>Create a donor or receiver account for the MVP.</p>
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
        <button className="button button-primary button-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
        <p className="form-footer">
          Already registered? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

