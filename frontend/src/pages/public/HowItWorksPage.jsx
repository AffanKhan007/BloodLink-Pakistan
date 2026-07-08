import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PageTransition from "../../components/PageTransition";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

const steps = [
  {
    title: "Post a blood request",
    description: "Enter the patient's blood group, hospital name, city, and urgency level. Upload a hospital slip so donors know the request is real.",
  },
  {
    title: "Donors get matched automatically",
    description: "The system finds approved donors in the same city with the right blood group who have not donated recently. They receive a notification and can accept or decline.",
  },
  {
    title: "Everything stays in one place",
    description: "Track who accepted, message donors directly, and update the request status. No more chasing replies across different apps.",
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
          <p className="eyebrow">How it works</p>
          <h1>From request to donor response in three steps.</h1>
          <p>
            When someone needs blood, every minute counts. BloodLink connects patients, donors, and hospitals through
            one system instead of scattered posts.
          </p>
        </section>

        <div className="timeline-grid">
          {steps.map((step, index) => (
            <section className="info-card timeline-card" key={step.title}>
              <span className="timeline-step">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </section>
          ))}
        </div>

        <section className="marketing-section marketing-section-soft section-center">
          <h2>Ready to get started?</h2>
          <p className="section-description">
            One account works for donors, request creators, or both. No role selection needed.
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
      </div>
      <PublicFooter />
    </div>
    </PageTransition>
  );
}
