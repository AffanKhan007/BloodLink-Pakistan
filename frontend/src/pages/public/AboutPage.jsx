import { BadgeCheck, Droplets, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="marketing-shell">
      <PublicHeader
        ctaLabel="Open workspace"
        ctaTo="/login"
        compact
        mobileOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <div className="public-page public-page-wide">
        <section className="content-card public-hero-card">
          <span className="alert-pill alert-pill-soft">About the platform</span>
          <h1>BloodLink makes blood coordination clearer and easier to manage.</h1>
          <p>
            BloodLink Pakistan helps organize blood requests, donor responses, and institutional coordination inside
            one clean workflow designed for urgent situations.
          </p>
        </section>

        <section className="feature-grid">
          <div className="info-card feature-card">
            <div className="feature-icon">
              <ShieldCheck size={18} />
            </div>
            <h3>Clear request flow</h3>
            <p>Requests move through a structured path instead of scattered messages and manual follow-up.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <Droplets size={18} />
            </div>
            <h3>Practical matching</h3>
            <p>The platform keeps matching focused on real-world factors like city, blood group, and availability.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <BadgeCheck size={18} />
            </div>
            <h3>Role-based workspaces</h3>
            <p>Each user type gets a simpler workspace built around the actions they actually need.</p>
          </div>
        </section>

        <section className="content-card disclaimer-card">
          <div className="list-row">
            <div>
              <p className="eyebrow">Medical and legal note</p>
              <h2>Hospitals remain responsible for final clinical decisions</h2>
            </div>
            <Stethoscope size={20} />
          </div>
          <p>
            This platform does not replace hospitals, licensed blood banks, screening, crossmatching, or transfusion
            approval. Final medical decisions must stay with authorized healthcare institutions.
          </p>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
