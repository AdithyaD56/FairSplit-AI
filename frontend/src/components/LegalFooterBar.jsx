import { Link } from "react-router-dom";

export default function LegalFooterBar() {
  return (
    <div className="legal-footer-bar">
      <p className="legal-footer-copy">© 2026 FairSplit AI. All rights reserved.</p>
      <div className="legal-footer-links">
        <Link to="/privacy" className="legal-footer-link">
          Privacy Policy
        </Link>
        <Link to="/terms" className="legal-footer-link">
          Terms & Conditions
        </Link>
      </div>
    </div>
  );
}
