import { Droplets } from "lucide-react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-panel">
        <div className="public-footer-brand">
          <div className="brand-mark">
            <Droplets size={18} />
          </div>
          <div className="brand-copy">
            <strong>BloodLink Pakistan</strong>
            <span>Modern blood donation coordination</span>
          </div>
        </div>

        <div className="public-footer-copy">
          <p>BloodLink Pakistan is a blood donation coordination platform for donors, receivers, hospitals, and blood banks.</p>
        </div>

        <div className="public-footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </footer>
  );
}
