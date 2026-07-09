import { Stethoscope } from "lucide-react";
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
          <p className="eyebrow">About BloodLink</p>
          <h1>Blood requests in Pakistan are scattered, slow, and hard to verify.</h1>
          <p>
            Families post on Facebook and WhatsApp hoping someone responds. Donors get duplicate messages. Hospitals
            cannot tell which requests are real. BloodLink puts requests, matching, and communication in one place.
          </p>
        </section>

        <section className="content-card">
          <p className="eyebrow">Why this exists</p>
          <h2>A single identity for giving and receiving</h2>
          <p>
            BloodLink uses a single-account model where one user can be a donor, a request creator, or both. There is no
            separate donor or receiver role. You set up a donor profile when you want to donate, and you create a blood
            request when you need support. The platform matches by city, blood-group compatibility, availability, and
            how recently someone donated.
          </p>
          <p>
            Institution donors (organizations that coordinate regular donations) register through a separate
            verification flow and only become publicly visible after admin approval. This keeps the platform trustworthy
            without requiring individual donor-level ID verification.
          </p>
        </section>

        <section className="content-card disclaimer-card">
          <div className="list-row">
            <div>
              <p className="eyebrow">Medical and legal note</p>
              <h2>Hospitals remain responsible for final clinical decisions</h2>
            </div>
            <Stethoscope size={16} />
          </div>
          <p>
            This application is not a replacement for hospitals, licensed blood banks, medical screening, or transfusion
            approval. Final blood testing, crossmatching, and transfusion decisions must be handled by authorized
            hospitals or blood banks.
          </p>
        </section>
      </div>
      <PublicFooter />
    </div>
    </PageTransition>
  );
}
