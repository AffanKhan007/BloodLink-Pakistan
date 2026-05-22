import { ArrowRight, Droplets, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
];

export default function PublicHeader({ ctaLabel = "Get started", ctaTo = "/register", compact = false, mobileOpen = false, onToggleMenu, onCloseMenu }) {
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
        <div className="marketing-nav-actions">
          <Link className="button button-tertiary" to="/login" onClick={onCloseMenu}>
            Login
          </Link>
          <Link className="button button-primary button-with-icon" to={ctaTo} onClick={onCloseMenu}>
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <div className="marketing-header-actions">
        <Link className="button button-tertiary" to="/login">
          Login
        </Link>
        <Link className="button button-primary button-with-icon" to={ctaTo}>
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </div>

      <button className="icon-button marketing-menu-button" type="button" onClick={onToggleMenu} aria-label="Toggle navigation">
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </header>
  );
}
