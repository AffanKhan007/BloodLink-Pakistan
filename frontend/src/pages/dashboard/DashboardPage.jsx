import { Bell, ClipboardList, Droplets, HeartHandshake, MapPin, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import DonutChart from "../../components/DonutChart";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import { staggerContainer, staggerItem } from "../../components/PageTransition";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const REQUEST_STATUS_COLORS = {
  pending_review: "var(--color-warning)",
  approved: "var(--color-info)",
  matched: "var(--color-urgent)",
  fulfilled: "var(--color-success)",
  rejected: "var(--color-danger)",
  cancelled: "var(--muted)",
};

const REQUEST_STATUS_LABELS = {
  pending_review: "Pending review",
  approved: "Approved",
  matched: "Matched",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: "",
    profile: null,
    requests: [],
    matches: [],
    notifications: [],
  });
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      apiRequest("/donors/profile/me", { token }).catch(() => null),
      apiRequest("/requests", { token }).catch(() => []),
      apiRequest("/matches/me", { token }).catch(() => []),
      apiRequest("/notifications", { token }).catch(() => []),
    ]).then((results) => {
      if (!mounted) return;
      setState({
        loading: false,
        error: results.some((r) => r.status === "rejected") ? "Some dashboard data could not be loaded yet." : "",
        profile: results[0].status === "fulfilled" ? results[0].value : null,
        requests: results[1].status === "fulfilled" ? results[1].value : [],
        matches: results[2].status === "fulfilled" ? results[2].value : [],
        notifications: results[3].status === "fulfilled" ? results[3].value : [],
      });
    });
    return () => { mounted = false; };
  }, [token]);

  if (state.loading) return <LoadingState label="Loading dashboard" />;

  const hasDonorProfile = state.profile !== null;
  const requestCount = state.requests.length;
  const unreadCount = state.notifications.filter((n) => !n.is_read).length;
  const activeMatches = state.matches.filter((m) => m.status === "pending" || m.status === "accepted");

  const requestStatusCounts = {};
  state.requests.forEach((r) => {
    requestStatusCounts[r.status] = (requestStatusCounts[r.status] || 0) + 1;
  });
  const requestDonutSegments = Object.entries(requestStatusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({
      label: REQUEST_STATUS_LABELS[status] || status,
      value,
      color: REQUEST_STATUS_COLORS[status] || "var(--muted)",
    }));

  return (
    <motion.div className="page-stack" {...motionProps}>
      {state.error ? <AlertMessage type="warning">{state.error}</AlertMessage> : null}

      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Dashboard"
          title="Your overview"
        />
      </motion.section>

      <motion.section {...itemProps}>
        <div className="stats-grid">
          {hasDonorProfile ? (
            <StatCard
              label="Donor profile"
              value={state.profile.blood_group}
              helper={`${state.profile.city}${state.profile.area ? ", " + state.profile.area : ""}`}
              icon={MapPin}
              tone="success"
            />
          ) : (
            <StatCard
              label="Donor profile"
              value="Not set up"
              helper="Create one to start donating"
              icon={UserPlus}
              tone="default"
            />
          )}
          <StatCard
            label="Blood requests"
            value={requestCount}
            helper={requestCount > 0 ? `${requestCount} created by you` : "Create your first request"}
            icon={ClipboardList}
            tone="default"
          />
          {hasDonorProfile ? (
            <StatCard
              label="My matches"
              value={state.matches.length}
              helper={activeMatches.length > 0 ? `${activeMatches.length} awaiting action` : "No active matches"}
              icon={HeartHandshake}
              tone={activeMatches.length > 0 ? "accent" : "default"}
            />
          ) : null}
          <StatCard
            label="Notifications"
            value={unreadCount}
            helper={unreadCount > 0 ? "Require your attention" : "All caught up"}
            icon={Bell}
            tone={unreadCount > 0 ? "warning" : "success"}
          />
        </div>
      </motion.section>

      {requestDonutSegments.length > 0 ? (
        <motion.section {...itemProps}>
          <div className="dashboard-split">
            <div className="content-card dashboard-chart-card">
              <p className="chart-card-title">Request status</p>
              <DonutChart
                segments={requestDonutSegments}
                centerLabel={requestCount}
                emptyLabel="No requests"
              />
              <div className="chart-legend">
                {requestDonutSegments.map((seg) => (
                  <div className="chart-legend-item" key={seg.label}>
                    <span className="chart-legend-dot" style={{ background: seg.color }} />
                    <span className="chart-legend-label">{seg.label}</span>
                    <span className="chart-legend-value">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-card dashboard-chart-card">
              <p className="chart-card-title">Match activity</p>
              <DonutChart
                segments={[
                  { label: "Active", value: activeMatches.length, color: "var(--color-urgent)" },
                  { label: "Completed", value: state.matches.filter((m) => m.status === "completed").length, color: "var(--color-success)" },
                  { label: "Other", value: state.matches.filter((m) => !["pending", "accepted", "completed"].includes(m.status)).length, color: "var(--muted)" },
                ]}
                centerLabel={state.matches.length}
                emptyLabel="No matches yet"
              />
              <div className="chart-legend">
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: "var(--color-urgent)" }} />
                  <span className="chart-legend-label">Active</span>
                  <span className="chart-legend-value">{activeMatches.length}</span>
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: "var(--color-success)" }} />
                  <span className="chart-legend-label">Completed</span>
                  <span className="chart-legend-value">{state.matches.filter((m) => m.status === "completed").length}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}

      {hasDonorProfile ? (
        <motion.section className="content-card" {...itemProps}>
          <SectionIntro
            eyebrow="Donor opportunities"
            title="My matches"
            description="Matched to your donor profile."
            actions={
              <Link className="button button-primary" to="/donor/matches">View my matches</Link>
            }
          />
          <div className="stats-mini">
            <StatCard label="Active matches" value={activeMatches.length} helper="Awaiting your response" icon={HeartHandshake} tone="accent" />
          </div>
        </motion.section>
      ) : (
        <motion.section className="content-card" {...itemProps}>
          <SectionIntro
            eyebrow="Become a donor"
            title="Set up your donor profile"
            description="Add blood group, city, and availability."
            actions={
              <Link className="button button-primary" to="/donor/profile">Create donor profile</Link>
            }
          />
        </motion.section>
      )}

      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Requests"
          title="Your blood requests"
          actions={
            <>
              <Link className="button button-secondary" to="/receiver/create-request">New request</Link>
              <Link className="button button-primary" to="/receiver/requests">View all</Link>
            </>
          }
        />
        {requestCount === 0 ? (
          <EmptyState title="No requests yet" description="Create a request to start matching." />
        ) : (
          <div className="card-list">
            {state.requests.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} footer={`${request.confirmed_donor_count} confirmed donors`} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
