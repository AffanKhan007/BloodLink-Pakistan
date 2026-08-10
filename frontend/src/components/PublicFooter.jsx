import Link from "next/link";
import SocialRow from "./SocialRow";

export default function PublicFooter() {
  return (
    <footer className="public-footer-slim">
      <div className="public-footer-slim-inner">
        <div className="public-footer-slim-brand">
          <strong>BloodLink Pakistan</strong>
          <span>Verified donation coordination</span>
        </div>
        <nav className="public-footer-links">
          <Link href="/transparency">Transparency & Impact</Link>
        </nav>
        <SocialRow />
      </div>
      <p className="public-footer-slim-legal">&copy; {new Date().getFullYear()} BloodLink Pakistan. All rights reserved.</p>
    </footer>
  );
}
