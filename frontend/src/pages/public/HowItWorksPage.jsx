import { ClipboardCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { useState } from "react";

import PageTransition from "../../components/PageTransition";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

const steps = [
  {
    title: "Post a blood request",
    description: "Enter the patient's blood group, hospital name, city, and urgency level. Upload a hospital slip so donors know the request is real.",
    icon: HeartHandshake,
  },
  {
    title: "Donors get matched automatically",
    description: "The system finds approved donors in the same city with the right blood group who haven't donated recently. They receive a notification and can accept or decline.",
    icon: ClipboardCheck,
  },
  {
    title: "Everything stays in one place",
    description: "Track who accepted, message donors directly, and update the request status. No more chasing replies across different apps.",
    icon: ShieldCheck,
  },
];

export default function HowItWorksPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition>
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
          <span className="alert-pill alert-pill-soft">How it works</span>
          <h1>From request to donor response in three steps.</h1>
          <p>
            When someone needs blood, every minute counts. BloodLink connects patients, donors, and hospitals through
            one system instead of scattered WhatsApp and Facebook posts.
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
    </PageTransition>
  );
}
