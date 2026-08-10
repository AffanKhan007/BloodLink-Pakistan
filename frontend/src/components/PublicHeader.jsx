import { ArrowRight, Droplets, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
];

export default function PublicHeader({ ctaLabel = "Get started", ctaTo = "/register", compact = false, mobileOpen = false, onToggleMenu, onCloseMenu }) {
  const pathname = usePathname();
  return (
    <header className="marketing-header">
      <Link className="brand-row" href="/" onClick={onCloseMenu}>
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
          <Link
            key={item.to}
            href={item.to}
            onClick={onCloseMenu}
            className={`public-nav-link${pathname === item.to ? " public-nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <div className="marketing-nav-actions">
          <Link className="button button-tertiary" href="/login" onClick={onCloseMenu}>
            Login
          </Link>
          <Link className="button button-primary button-with-icon" href={ctaTo} onClick={onCloseMenu}>
            {ctaLabel}
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <div className="marketing-header-actions">
        <Link className="button button-tertiary" href="/login">
          Login
        </Link>
        <Link className="button button-primary button-with-icon" href={ctaTo}>
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
