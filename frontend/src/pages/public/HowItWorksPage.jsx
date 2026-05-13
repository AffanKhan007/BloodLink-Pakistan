import { ClipboardCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { useState } from "react";

import PublicHeader from "../../components/PublicHeader";

const steps = [
  {
    title: "Donors register and complete profiles",
    description: "Donors share blood group, city, area, and availability. Admins verify profiles before matching.",
    icon: HeartHandshake,
  },
  {
    title: "Receivers submit structured blood requests",
    description: "Patient attendants add hospital details, urgency, required time, and upload a hospital slip for review.",
    icon: ClipboardCheck,
  },
  {
    title: "Admins review and coordinate safely",
    description: "Approved donors are matched to approved requests using practical MVP rules for blood group, city, availability, and donation recency.",
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
          <h1>A practical donor-to-request workflow designed for urgent real-world use.</h1>
          <p>
            BloodLink avoids pretending to replace hospitals. Instead, it adds better verification, clearer matching,
            and more accountable status tracking around the coordination layer.
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
    </div>
  );
}
