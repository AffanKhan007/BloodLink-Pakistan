import { Building2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

export default function InstitutionDashboardPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/institutions/me", { token }).catch(() => null), apiRequest("/chats", { token }).catch(() => [])])
      .then(([profileData, chatData]) => {
        setProfile(profileData);
        setChats(chatData);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading institution dashboard" />;
  if (!profile) return <EmptyState title="No institution profile yet" description="Create a profile to receive outreach." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Institution"
          title={profile.institution_name}
          description="Manage profile and receiver messages."
          actions={
            <>
              <Link className="button button-secondary" to="/institution/profile">
                Edit profile
              </Link>
              <Link className="button button-primary" to="/institution/messages">
                Open messages
              </Link>
            </>
          }
        />
      </section>
      <section className="stats-grid">
        <StatCard label="Institution type" value={profile.institution_type} helper={profile.city} icon={Building2} tone="default" />
        <StatCard label="Approval status" value={profile.status} helper="Admin moderation state" icon={Building2} tone="success" />
        <StatCard label="Open conversations" value={chats.length} helper="Receiver outreach threads" icon={MessageSquare} tone="accent" />
      </section>
    </div>
  );
}
