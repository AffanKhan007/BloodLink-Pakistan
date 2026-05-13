import { BadgeCheck, Droplets, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

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
          <h1>BloodLink brings structure, verification, and accountability to blood request coordination.</h1>
          <p>
            BloodLink Pakistan is designed to reduce fake appeals, improve request verification, protect donor privacy,
            and give patient attendants a clearer process from request creation to donor matching.
          </p>
        </section>

        <section className="feature-grid">
          <div className="info-card feature-card">
            <div className="feature-icon">
              <ShieldCheck size={18} />
            </div>
            <h3>Verified request routing</h3>
            <p>Every request is meant to move through a review workflow before coordination starts.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <Droplets size={18} />
            </div>
            <h3>Focused operational matching</h3>
            <p>The MVP prioritizes practical matching rules over over-engineered automation.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <BadgeCheck size={18} />
            </div>
            <h3>Professional stakeholder workspaces</h3>
            <p>Donors, receivers, admins, hospitals, and blood banks each get role-aware views.</p>
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
    </div>
  );
}
