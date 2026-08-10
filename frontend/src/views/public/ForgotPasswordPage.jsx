import { Mail } from "lucide-react";
import Link from "next/link";

import AuthShell from "../../components/AuthShell";
import PageTransition from "../../components/PageTransition";

export default function ForgotPasswordPage() {
  return (
    <PageTransition>
    <AuthShell
      title="Password recovery"
      description="Contact the support team for account recovery support."
      accent="Support"
    >
      <div className="auth-placeholder">
        <div className="state-illustration">
          <Mail size={22} />
        </div>
        <h2>Need help signing in?</h2>

        <div className="auth-placeholder-actions">
          <Link className="button button-primary" href="/login">
            Back to login
          </Link>
          <Link className="button button-secondary" href="/register">
            Create an account
          </Link>
        </div>
      </div>
    </AuthShell>
    </PageTransition>
  );
}
