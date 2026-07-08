import { ArrowRight, ClipboardCheck, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PageTransition from "../../components/PageTransition";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

const steps = [
  {
    title: "Create a request",
    description: "Add patient details, hospital info, urgency level, and a supporting slip.",
  },
  {
    title: "Match with donors",
    description: "Compatible donors, blood banks, and institutions surface in your city automatically.",
  },
  {
    title: "Track and fulfill",
    description: "Monitor responses, message participants, and update the request status as support is confirmed.",
  },
];

const benefits = [
  {
    title: "Structured requests",
    description: "Every request includes hospital details and a supporting slip so donors can verify before responding.",
    icon: ClipboardCheck,
  },
  {
    title: "Automatic matching",
    description: "Donors are matched by city, blood-group compatibility, and donation recency — no manual searching.",
    icon: HeartHandshake,
  },
  {
    title: "Role-based access",
    description: "Each user sees only what is relevant to their role. Admins moderate the platform.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition>
    <div className="marketing-shell">
      <PublicHeader
        ctaLabel="Get started"
        ctaTo="/register"
        mobileOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <section className="hero">
        <div className="hero-copy-column">
          <p className="eyebrow">Blood donation coordination</p>
          <h1>One platform instead of scattered posts.</h1>
          <p className="hero-copy">
            BloodLink connects donors, hospitals, and blood banks through verified requests, automatic matching, and in-app coordination — no more Facebook and WhatsApp threads.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-with-icon" to="/register">
              Register
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" to="/login">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-panel hero-panel-large">
          <div className="hero-surface hero-surface-minimal">
            <div className="hero-surface-copy">
              <p className="eyebrow">How it works</p>
              <h3>Request &rarr; match &rarr; fulfill</h3>
              <p>Create a request with hospital details, get matched with compatible donors, and track everything in one place.</p>
            </div>
            <div className="hero-preview-grid">
              <div className="mini-stat">
                <div className="hero-stat-icon"><MapPin size={16} /></div>
                <strong>City &amp; blood-group matching</strong>
                <p>Donors are surfaced based on city, compatibility, availability, and donation recency.</p>
              </div>
              <div className="mini-stat">
                <div className="hero-stat-icon"><ClipboardCheck size={16} /></div>
                <strong>Hospital slip required</strong>
                <p>Every request includes a supporting document so donors know it is legitimate.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">How it works</p>
            <h2>Three steps from request to response</h2>
            <p className="section-description">
              BloodLink keeps the process clear and actionable when every minute counts.
            </p>
          </div>
        </div>
        <div className="timeline-grid">
          {steps.map((item, index) => (
            <section className="info-card timeline-card" key={item.title}>
              <span className="timeline-step">Step {index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">Why BloodLink</p>
            <h2>Built for clarity and trust</h2>
            <p className="section-description">
              The platform focuses on verified information, relevant matches, and clear roles.
            </p>
          </div>
        </div>
        <div className="feature-grid">
          {benefits.map((item) => (
            <div className="info-card feature-card" key={item.title}>
              <div className="feature-icon">
                <item.icon size={18} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section-soft section-center">
        <h2>Ready to get started?</h2>
        <p className="section-description">
          Create an account in under a minute. One account works for donors, request creators, or both.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link className="button button-primary button-with-icon" to="/register">
            Create account
            <ArrowRight size={16} />
          </Link>
          <Link className="button button-secondary" to="/login">
            Sign in
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
    </PageTransition>
  );
}
