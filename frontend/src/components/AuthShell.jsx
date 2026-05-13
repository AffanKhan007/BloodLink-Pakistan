import { CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

import PublicHeader from "./PublicHeader";

const trustItems = [
  "Role-based workspaces for donors, receivers, hospitals, and blood banks.",
  "Protected hospital slip access and privacy-aware coordination.",
  "Clear status tracking from review to matching and fulfillment.",
];

const statItems = [
  { label: "Verified request flow", value: "Admin review first" },
  { label: "Matching logic", value: "City + blood group" },
  { label: "Safety note", value: "Not a transfusion approval system" },
];

export default function AuthShell({ title, description, accent, footer, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="auth-shell">
      <div className="marketing-shell auth-shell-inner">
        <PublicHeader
          ctaLabel="Back to home"
          ctaTo="/"
          compact
          mobileOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((current) => !current)}
          onCloseMenu={() => setMenuOpen(false)}
        />

        <div className="auth-layout">
          <section className="auth-aside">
            <div className="surface-highlight">
              <span className="alert-pill alert-pill-soft">{accent}</span>
              <h1>{title}</h1>
              <p className="hero-copy">{description}</p>
            </div>

            <div className="auth-trust-panel">
              <div className="info-card auth-trust-card">
                <div className="section-heading section-heading-start">
                  <div>
                    <p className="eyebrow">Why teams trust BloodLink</p>
                    <h2>Built for urgent coordination</h2>
                  </div>
                  <div className="icon-glow">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <div className="check-list">
                  {trustItems.map((item) => (
                    <div className="check-item" key={item}>
                      <CheckCircle2 size={18} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metrics-strip">
                {statItems.map((item) => (
                  <div className="metric-chip" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="auth-note">
                <Stethoscope size={18} />
                <p>Hospitals and blood banks remain responsible for screening, crossmatching, and transfusion approval.</p>
              </div>
            </div>
          </section>

          <section className="form-card auth-card">
            {children}
            {footer}
          </section>
        </div>
      </div>
    </div>
  );
}
