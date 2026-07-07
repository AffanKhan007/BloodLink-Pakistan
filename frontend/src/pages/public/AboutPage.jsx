import { BadgeCheck, Droplets, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

import PageTransition from "../../components/PageTransition";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition>
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
          <span className="alert-pill alert-pill-soft">About BloodLink</span>
          <h1>Blood requests in Pakistan are scattered, slow, and hard to verify.</h1>
          <p>
            Families post on Facebook and WhatsApp hoping someone responds. Donors get duplicate messages. Hospitals
            can't tell which requests are real. BloodLink puts requests, matching, and communication in one place.
          </p>
        </section>

        <section className="feature-grid">
          <div className="info-card feature-card">
            <div className="feature-icon">
              <ShieldCheck size={18} />
            </div>
            <h3>Verified requests</h3>
            <p>Every request includes hospital details and an uploaded slip so donors know it's real before they respond.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <Droplets size={18} />
            </div>
            <h3>Automatic matching</h3>
            <p>Donors are matched by city, blood group, and how recently they donated — no more scrolling through comment threads.</p>
          </div>
          <div className="info-card feature-card">
            <div className="feature-icon">
              <BadgeCheck size={18} />
            </div>
            <h3>Request tracking</h3>
            <p>Each request shows its current status, who accepted, and what still needs to happen. Nothing falls through the cracks.</p>
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
    </PageTransition>
  );
}
