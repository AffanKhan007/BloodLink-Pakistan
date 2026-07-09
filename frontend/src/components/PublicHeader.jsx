import { ArrowRight, Droplets, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
];

export default function PublicHeader({ ctaLabel = "Get started", ctaTo = "/register", compact = false, mobileOpen = false, onToggleMenu, onCloseMenu }) {
  return (
    <header className="marketing-header">
      <Link className="brand-row" to="/" onClick={onCloseMenu}>
        <div className="brand-mark">
          <Droplets size={15} />
        </div>
        <div className="brand-copy">
          <strong>BloodLink Pakistan</strong>
          <span>Verified coordination platform</span>
        </div>
      </Link>

      <nav className={`marketing-nav ${mobileOpen ? "marketing-nav-open" : ""}`}>
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onCloseMenu}
            className={({ isActive }) => `public-nav-link${isActive ? " public-nav-link-active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="marketing-nav-actions">
          <Link className="button button-tertiary" to="/login" onClick={onCloseMenu}>
            Login
          </Link>
          <Link className="button button-primary button-with-icon" to={ctaTo} onClick={onCloseMenu}>
            {ctaLabel}
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <div className="marketing-header-actions">
        <Link className="button button-tertiary" to="/login">
          Login
        </Link>
        <Link className="button button-primary button-with-icon" to={ctaTo}>
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>

      <button className="icon-button marketing-menu-button" type="button" onClick={onToggleMenu} aria-label="Toggle navigation">
        {mobileOpen ? <X size={15} /> : <Menu size={15} />}
      </button>
    </header>
  );
}
