import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";

export default function ForgotPasswordPage() {
  return (
    <PageTransition>
    <AuthShell
      title="Password recovery"
      description="Password reset is not automated in this MVP yet. If you need help recovering access, contact the BloodLink administrator or support contact for your organization."
      accent="Support"
    >
      <div className="auth-placeholder">
        <div className="state-illustration">
          <Mail size={22} />
        </div>
        <h2>Need help signing in?</h2>
        <p>Use the login page again if you remember your credentials, or contact your platform administrator for account recovery support.</p>
        <div className="auth-placeholder-actions">
          <Link className="button button-primary" to="/login">
            Back to login
          </Link>
          <Link className="button button-secondary" to="/register">
            Create an account
          </Link>
        </div>
      </div>
    </AuthShell>
    </PageTransition>
  );
}
