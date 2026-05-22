import { useState } from "react";

import PublicHeader from "./PublicHeader";

export default function AuthShell({ title, description, accent, footer, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="auth-shell">
      <div className="marketing-shell auth-shell-inner">
        <PublicHeader compact mobileOpen={menuOpen} onToggleMenu={() => setMenuOpen((current) => !current)} onCloseMenu={() => setMenuOpen(false)} />

        <div className="auth-minimal-shell">
          <section className="auth-card auth-card-minimal">
            <div className="auth-card-intro">
              {accent ? <span className="alert-pill alert-pill-soft">{accent}</span> : null}
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {children}
            {footer}
          </section>
        </div>
      </div>
    </div>
  );
}
