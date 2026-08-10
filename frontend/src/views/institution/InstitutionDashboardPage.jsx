import { Building2, MessageSquare } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import DonutChart from "../../components/DonutChart";
import { EmptyState, LoadingState } from "../../components/PageState";
import { staggerContainer, staggerItem } from "../../components/PageTransition";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const STATUS_TONES = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "warning",
};

export default function InstitutionDashboardPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

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

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const unreadChats = chats.filter((c) => c.unread_count > 0);
  const recentChats = chats.filter((c) => c.unread_count === 0 && now - new Date(c.updated_at).getTime() < sevenDays);
  const olderChats = chats.filter((c) => c.unread_count === 0 && now - new Date(c.updated_at).getTime() >= sevenDays);

  const conversationSegments = [
    { label: "Unread", value: unreadChats.length, color: "var(--color-warning)" },
    { label: "Recent", value: recentChats.length, color: "var(--color-info)" },
    { label: "Older", value: olderChats.length, color: "var(--muted)" },
  ].filter((s) => s.value > 0);

  return (
    <motion.div className="page-stack" {...motionProps}>
      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Institution"
          title={profile.institution_name}
          description="Manage profile and receiver messages."
          actions={
            <>
              <Link className="button button-secondary" href="/institution/profile">
                Edit profile
              </Link>
              <Link className="button button-primary" href="/institution/messages">
                Open messages
              </Link>
            </>
          }
        />
      </motion.section>

      <motion.section {...itemProps}>
        <div className="stats-grid">
          <StatCard label="Institution type" value={profile.institution_type} helper={profile.city} icon={Building2} tone="default" />
          <StatCard
            label="Approval status"
            value={profile.status}
            helper={
              profile.status === "approved"
                ? "Verified and active"
                : profile.status === "pending"
                ? "Awaiting admin verification"
                : "Current platform state"
            }
            icon={Building2}
            tone={STATUS_TONES[profile.status] || "default"}
          />
          <StatCard
            label="Conversations"
            value={chats.length}
            helper={
              unreadChats.length > 0
                ? `${unreadChats.length} unread from receivers`
                : chats.length > 0
                ? "All conversations reviewed"
                : "No outreach yet"
            }
            icon={MessageSquare}
            tone={unreadChats.length > 0 ? "warning" : "default"}
          />
        </div>
      </motion.section>

      {chats.length > 0 ? (
        <motion.section {...itemProps}>
          <div className="dashboard-split">
            <div className="content-card dashboard-chart-card">
              <p className="chart-card-title">Conversation activity</p>
              <DonutChart
                segments={conversationSegments}
                centerLabel={chats.length}
                emptyLabel="No conversations"
              />
              <div className="chart-legend">
                {conversationSegments.map((seg) => (
                  <div className="chart-legend-item" key={seg.label}>
                    <span className="chart-legend-dot" style={{ background: seg.color }} />
                    <span className="chart-legend-label">{seg.label}</span>
                    <span className="chart-legend-value">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-card dashboard-chart-card">
              <p className="chart-card-title">Quick stats</p>
              <div className="chart-quick-stats">
                <div className="chart-quick-stat">
                  <span className="chart-quick-stat-value">{unreadChats.length}</span>
                  <span className="chart-quick-stat-label">Unread messages</span>
                </div>
                <div className="chart-quick-stat">
                  <span className="chart-quick-stat-value">{recentChats.length}</span>
                  <span className="chart-quick-stat-label">Active this week</span>
                </div>
                <div className="chart-quick-stat">
                  <span className="chart-quick-stat-value">{olderChats.length}</span>
                  <span className="chart-quick-stat-label">Older threads</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}
    </motion.div>
  );
}
