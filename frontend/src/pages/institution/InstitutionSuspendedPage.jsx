import { Link } from "react-router-dom";

import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function InstitutionSuspendedPage() {
  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution access"
          title="Account suspended"
          description="Please contact admin support."
          actions={
            <>
              <StatusBadge value="suspended" />
              <Link className="button button-tertiary" to="/">
                Back to home
              </Link>
            </>
          }
        />
      </section>
    </div>
  );
}
