import { ArrowRight, Droplets, HeartHandshake, Menu, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
];

export default function PublicHeader({ ctaLabel = "Open workspace", ctaTo = "/login", compact = false, mobileOpen = false, onToggleMenu, onCloseMenu }) {
  return (
    <header className={`marketing-header ${compact ? "marketing-header-compact" : ""}`}>
      <Link className="brand-row" to="/" onClick={onCloseMenu}>
        <div className="brand-mark">
          <Droplets size={18} />
        </div>
        <div className="brand-copy">
          <strong>BloodLink Pakistan</strong>
          <span>Verified coordination platform</span>
        </div>
      </Link>

      <nav className={`marketing-nav ${mobileOpen ? "marketing-nav-open" : ""}`}>
        {navLinks.map((item) => (
          <Link key={item.to} to={item.to} onClick={onCloseMenu}>
            {item.label}
          </Link>
        ))}
        <div className="marketing-nav-badges">
          <span className="nav-badge">
            <ShieldCheck size={14} />
            Admin reviewed
          </span>
          <span className="nav-badge">
            <HeartHandshake size={14} />
            Privacy aware
          </span>
        </div>
        <Link className="button button-primary button-with-icon" to={ctaTo} onClick={onCloseMenu}>
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </nav>

      <button className="icon-button marketing-menu-button" type="button" onClick={onToggleMenu} aria-label="Toggle navigation">
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </header>
  );
}
