import { ClipboardCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { useState } from "react";

import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

const steps = [
  {
    title: "Create a request",
    description: "Receivers add patient details, urgency, and hospital information in one place.",
    icon: HeartHandshake,
  },
  {
    title: "Match the right support",
    description: "Compatible donors and city-based organizations are surfaced through focused matching rules.",
    icon: ClipboardCheck,
  },
  {
    title: "Track and respond",
    description: "Messages, responses, and request status stay organized through a clean coordination workflow.",
    icon: ShieldCheck,
  },
];

export default function HowItWorksPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="marketing-shell">
      <PublicHeader
        ctaLabel="Start now"
        ctaTo="/register"
        compact
        mobileOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <div className="public-page public-page-wide">
        <section className="content-card public-hero-card">
          <span className="alert-pill alert-pill-soft">How coordination works</span>
          <h1>A simple workflow designed for urgent coordination.</h1>
          <p>
            The platform keeps the process short, clear, and easy to follow for donors, receivers, and operational teams.
          </p>
        </section>
        <div className="timeline-grid">
          {steps.map((step, index) => (
            <section className="info-card timeline-card" key={step.title}>
              <div className="feature-icon">
                <step.icon size={18} />
              </div>
              <span className="timeline-step">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </section>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
