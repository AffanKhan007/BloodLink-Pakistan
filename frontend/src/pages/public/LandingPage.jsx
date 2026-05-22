import { ArrowRight, Building2, CalendarClock, CheckCircle2, Droplets, HeartHandshake, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

const featureCards = [
  {
    title: "Structured request capture",
    description: "Receivers create clear blood requests with hospital details, urgency, and supporting documents.",
    icon: ShieldCheck,
  },
  {
    title: "Practical matching",
    description: "Donors are matched using city, blood-group compatibility, availability, and donation eligibility.",
    icon: HeartHandshake,
  },
  {
    title: "Focused workspaces",
    description: "Each role gets a clean dashboard for action, tracking, and follow-up without unnecessary clutter.",
    icon: Building2,
  },
];

const steps = [
  {
    title: "Create a request",
    description: "Add patient need, hospital context, urgency, and supporting slip.",
    icon: Droplets,
  },
  {
    title: "Find the right support",
    description: "Surface compatible donors, blood banks, and institutions in the same city.",
    icon: HeartHandshake,
  },
  {
    title: "Track the outcome",
    description: "Monitor responses, message participants, and mark fulfilled when support is confirmed.",
    icon: CalendarClock,
  },
];

const trustItems = [
  {
    title: "Role-based access",
    description: "Each user sees only the actions and data relevant to their role.",
    icon: ShieldCheck,
  },
  {
    title: "Clear status tracking",
    description: "Requests, matches, and replies stay organized from creation to fulfillment.",
    icon: CheckCircle2,
  },
];

const heroPreviewCards = [
  {
    label: "Request tracking",
    value: "Clear updates",
    description: "Follow every request from creation to fulfillment.",
    icon: Droplets,
  },
  {
    label: "Donor matching",
    value: "Relevant only",
    description: "Donors see focused opportunities instead of every request.",
    icon: HeartHandshake,
  },
  {
    label: "Operational view",
    value: "One platform",
    description: "Admins, hospitals, and blood banks coordinate from clean dashboards.",
    icon: Building2,
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
          <p className="eyebrow">Verified donation coordination</p>
          <h1>Modern blood coordination for urgent care teams.</h1>
          <p className="hero-copy">
            BloodLink helps donors, receivers, hospitals, and blood banks manage blood requests through a clear,
            structured, and trustworthy workflow.
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
              <p className="eyebrow">Platform preview</p>
              <h3>Clean coordination from request to response</h3>
              <p>A lighter, more focused experience for donors, receivers, and operational teams.</p>
            </div>
            <div className="hero-preview-grid">
              {heroPreviewCards.map((item) => (
                <div className="mini-stat" key={item.label}>
                  <div className="hero-stat-icon">
                    <item.icon size={16} />
                  </div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">How it works</p>
            <h2>A simple workflow that is easy to understand</h2>
            <p className="section-description">
              BloodLink keeps the process short, readable, and actionable for urgent cases.
            </p>
          </div>
        </div>
        <div className="timeline-grid">
          {steps.map((item, index) => (
            <section className="info-card timeline-card" key={item.title}>
              <div className="feature-icon">
                <item.icon size={18} />
              </div>
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
            <p className="eyebrow">Core platform value</p>
            <h2>Key product benefits</h2>
            <p className="section-description">
              A smaller, clearer interface helps the platform feel more trustworthy and easier to use when urgency matters.
            </p>
          </div>
        </div>
        <div className="feature-grid">
          {featureCards.map((item) => (
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

      <section className="marketing-section">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">Trust and safety</p>
            <h2>Built to feel trustworthy</h2>
            <p className="section-description">
              The interface keeps the most important actions visible and the rest out of the way.
            </p>
          </div>
        </div>
        <div className="trust-grid">
          {trustItems.map((item) => (
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

      <PublicFooter />
    </div>
  );
}
