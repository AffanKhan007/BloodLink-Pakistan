import { Activity, ArrowRight, Clock3, Droplets, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PublicHeader from "../../components/PublicHeader";

const heroStats = [
  { label: "Verified request flow", value: "Admin reviewed before matching", icon: ShieldCheck },
  { label: "Response speed", value: "Clear status tracking for urgent cases", icon: Clock3 },
  { label: "Privacy-first donor flow", value: "Controlled contact visibility", icon: Users },
];

const featureCards = [
  {
    title: "Trusted verification before outreach",
    description: "Patient attendants submit structured requests with hospital context and supporting documents before coordination begins.",
    icon: ShieldCheck,
  },
  {
    title: "Simple donor matching that stays practical",
    description: "The MVP keeps matching realistic: blood group, city, availability, and recent donation history.",
    icon: HeartHandshake,
  },
  {
    title: "Operational visibility for every stakeholder",
    description: "Donors, receivers, hospitals, blood banks, and admins each get a focused workspace instead of chaotic chat threads.",
    icon: Activity,
  },
];

const testimonials = [
  {
    quote: "We needed a flow that feels calm in emergencies. BloodLink replaces panic-driven outreach with a structured process.",
    author: "Operations lead",
    role: "Blood donation coordination",
  },
  {
    quote: "The request tracking and donor privacy controls make this feel like a real platform, not another spreadsheet-backed list.",
    author: "Hospital admin",
    role: "Lahore-based healthcare team",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="marketing-shell">
      <PublicHeader
        ctaLabel="Open workspace"
        ctaTo="/login"
        mobileOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <section className="hero">
        <div className="hero-copy-column">
          <span className="alert-pill">
            <Sparkles size={14} />
            Production-ready healthcare UI
          </span>
          <p className="eyebrow">Verified donation coordination</p>
          <h1>Connect urgent blood requests with real donors, not scattered WhatsApp lists.</h1>
          <p className="hero-copy">
            BloodLink helps donors, patient attendants, and admins coordinate verified blood requests with safer
            workflows, privacy-aware matching, and clear status tracking.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-with-icon" to="/register">
              Become a donor
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary button-with-icon" to="/receiver/create-request">
              Request blood
              <Droplets size={16} />
            </Link>
          </div>

          <div className="hero-stats-grid">
            {heroStats.map((item) => (
              <div className="hero-stat" key={item.label}>
                <div className="hero-stat-icon">
                  <item.icon size={16} />
                </div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-panel hero-panel-large">
          <div className="hero-surface">
            <div className="hero-surface-header">
              <span className="alert-pill alert-pill-soft">Critical request</span>
              <span className="hero-surface-chip">Lahore active</span>
            </div>
            <h3>B+ Blood Needed</h3>
            <p>Services Hospital Lahore</p>
            <div className="hero-availability-grid">
              <div className="mini-stat">
                <span>Units required</span>
                <strong>2 units</strong>
              </div>
              <div className="mini-stat">
                <span>Urgency</span>
                <strong>High priority</strong>
              </div>
              <div className="mini-stat">
                <span>Review status</span>
                <strong>Admin approved</strong>
              </div>
              <div className="mini-stat">
                <span>Matching rule</span>
                <strong>City + group</strong>
              </div>
            </div>
          </div>

          <div className="hero-panel-stack">
            <div className="info-card">
              <div className="list-row">
                <div>
                  <p className="eyebrow">Receiver experience</p>
                  <h3>Track every status change</h3>
                </div>
                <Users size={18} />
              </div>
              <p>From pending review to matched to fulfilled, every step stays visible instead of getting lost in chat history.</p>
            </div>
            <div className="info-card">
              <div className="list-row">
                <div>
                  <p className="eyebrow">Donor experience</p>
                  <h3>See only relevant requests</h3>
                </div>
                <HeartHandshake size={18} />
              </div>
              <p>Donors only see matching approved requests and assigned coordination, keeping the UI focused and respectful.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">Core platform value</p>
            <h2>Built for credibility during urgent care coordination</h2>
            <p className="section-description">
              The interface is designed to feel trustworthy under pressure, with a clean emergency-ready visual system,
              clear calls to action, and role-specific operational views.
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

      <section className="marketing-section marketing-section-soft">
        <div className="section-heading">
          <div className="section-copy">
            <p className="eyebrow">Social proof</p>
            <h2>Teams need healthcare software that feels calm, clear, and accountable</h2>
          </div>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <blockquote className="info-card testimonial-card" key={item.author}>
              <p>{item.quote}</p>
              <footer>
                <strong>{item.author}</strong>
                <span>{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
