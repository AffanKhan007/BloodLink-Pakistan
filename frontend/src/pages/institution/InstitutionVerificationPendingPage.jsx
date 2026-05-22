import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function InstitutionVerificationPendingPage() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/institutions/me", { token })
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading verification status" />;
  if (!profile) return <EmptyState title="Institution details unavailable" description="Your verification submission could not be loaded." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution verification"
          title="Verification in Progress"
          description="Your institution account is under admin review. You will be able to access your institution dashboard after approval."
          actions={
            <>
              <StatusBadge value="pending_approval" />
              <button
                className="button button-secondary"
                onClick={() => {
                  logout();
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
              <Link className="button button-tertiary" to="/">
                Back to home
              </Link>
            </>
          }
        />
      </section>
      <section className="content-card">
        <div className="details-list">
          <div><strong>Institution</strong><p>{profile.institution_name}</p></div>
          <div><strong>Type</strong><p>{profile.institution_type}</p></div>
          <div><strong>City</strong><p>{profile.city}{profile.area ? ` / ${profile.area}` : ""}</p></div>
          <div><strong>Contact person</strong><p>{profile.contact_person}{profile.contact_person_designation ? `, ${profile.contact_person_designation}` : ""}</p></div>
          <div><strong>Official email</strong><p>{profile.email}</p></div>
          <div><strong>Phone</strong><p>{profile.phone}</p></div>
          <div><strong>Address</strong><p>{profile.address}</p></div>
        </div>
      </section>
    </div>
  );
}
