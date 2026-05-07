import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { AlertMessage } from "../../components/PageState";

function destinationForRole(role) {
  if (role === "admin") return "/admin";
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
    <div className="auth-shell">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p>Access your donor, receiver, or admin workspace.</p>
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
        <button className="button button-primary button-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="form-footer">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}

