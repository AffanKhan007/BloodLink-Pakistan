import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="marketing-shell">
      <header className="marketing-header">
        <div className="brand-row">
          <div className="brand-mark">BL</div>
          <strong>BloodLink Pakistan</strong>
        </div>
        <nav className="marketing-nav">
          <Link to="/about">About</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Verified donation coordination</p>
          <h1>Connect urgent blood requests with real donors, not scattered WhatsApp lists.</h1>
          <p className="hero-copy">
            BloodLink helps donors, patient attendants, and admins coordinate verified blood requests with safer
            workflows, privacy-aware matching, and clear status tracking.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/register">
              Join BloodLink
            </Link>
            <Link className="button button-secondary" to="/how-it-works">
              See the flow
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="emergency-card">
            <span className="alert-pill">Critical request</span>
            <h3>B+ Blood Needed</h3>
            <p>Services Hospital Lahore</p>
            <ul className="hero-list">
              <li>Admin-reviewed requests</li>
              <li>Simple city + blood group matching</li>
              <li>Protected hospital slip access</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

