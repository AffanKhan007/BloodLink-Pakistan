import { Building2, ClipboardCheck, FileClock, HeartHandshake, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import DonutChart from "../../components/DonutChart";
import { LoadingState } from "../../components/PageState";
import { staggerContainer, staggerItem } from "../../components/PageTransition";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const STAFF_ROLES = new Set([
  "admin", "super_admin", "operations_agent",
  "blood_bank_admin", "blood_bank_staff", "auditor",
]);

const CHART_COLORS = {
  members: "var(--color-info)",
  institutions: "var(--color-success)",
  staff: "var(--color-urgent)",
};

const BLOOD_GROUP_COLORS = {
  "A+": "#DC2626",
  "A-": "#EA580C",
  "B+": "#2563EB",
  "B-": "#7C3AED",
  "AB+": "#0891B2",
  "AB-": "#059669",
  "O+": "#D97706",
  "O-": "#6366F1",
};

const STATUS_COLORS = {
  pending_review: "#F59E0B",
  approved: "#3B82F6",
  matched: "#8B5CF6",
  fulfilled: "#10B981",
  rejected: "#EF4444",
  cancelled: "#6B7280",
};

const URGENCY_COLORS = {
  low: "#6B7280",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#DC2626",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function countBy(arr, keyFn) {
  const counts = {};
  arr.forEach((item) => {
    const key = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function segmentsFromCounts(counts, colorMap) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: colorMap[label] || "#9CA3AF",
    }));
}

function buildDonutSegments(arr, keyFn, colorMap) {
  const counts = countBy(arr, keyFn);
  return segmentsFromCounts(counts, colorMap);
}

function DonutChartCard({ title, segments, centerLabel, emptyLabel }) {
  return (
    <div className="content-card">
      <p className="chart-card-title">{title}</p>
      <DonutChart
        segments={segments}
        centerLabel={centerLabel}
        emptyLabel={emptyLabel || "No data yet"}
      />
      <div className="chart-legend">
        {segments.map((seg) => (
          <div className="chart-legend-item" key={seg.label}>
            <span className="chart-legend-dot" style={{ background: seg.color }} />
            <span className="chart-legend-label">{seg.label}</span>
            <span className="chart-legend-value">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState(null);
  const [donors, setDonors] = useState(null);
  const [requests, setRequests] = useState(null);
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

  useEffect(() => {
    apiRequest("/admin/dashboard", { token }).then(setStats);
    apiRequest("/admin/users", { token }).then((data) => {
      const users = data.items || data;
      if (Array.isArray(users)) {
        const counts = { members: 0, institutions: 0, staff: 0 };
        users.forEach((u) => {
          if (u.role === "member") counts.members++;
          else if (u.role === "institution_donor") counts.institutions++;
          else if (STAFF_ROLES.has(u.role)) counts.staff++;
        });
        setUserBreakdown(counts);
      }
    });
    apiRequest("/admin/donors", { token }).then((data) => {
      const donors = data.items || data;
      if (Array.isArray(donors)) setDonors(donors);
    });
    apiRequest("/admin/requests", { token }).then((data) => {
      const requests = data.items || data;
      if (Array.isArray(requests)) setRequests(requests);
    });
  }, [token]);

  const donutSegments = userBreakdown
    ? [
        { label: "Members", value: userBreakdown.members, color: CHART_COLORS.members },
        { label: "Institutions", value: userBreakdown.institutions, color: CHART_COLORS.institutions },
        { label: "Staff", value: userBreakdown.staff, color: CHART_COLORS.staff },
      ]
    : [];

  const donorBloodSegments = useMemo(() => {
    if (!donors) return [];
    return buildDonutSegments(donors, "blood_group", BLOOD_GROUP_COLORS);
  }, [donors]);

  const requestBloodSegments = useMemo(() => {
    if (!requests) return [];
    return buildDonutSegments(requests, "blood_group_needed", BLOOD_GROUP_COLORS);
  }, [requests]);

  const statusSegments = useMemo(() => {
    if (!requests) return [];
    return buildDonutSegments(requests, "status", STATUS_COLORS);
  }, [requests]);

  const urgencySegments = useMemo(() => {
    if (!requests) return [];
    return buildDonutSegments(requests, "urgency_level", URGENCY_COLORS);
  }, [requests]);

  const topCities = useMemo(() => {
    if (!donors) return [];
    const counts = countBy(donors, "city");
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [donors]);

  const maxCityCount = topCities.length > 0 ? topCities[0][1] : 1;

  if (!stats) return <LoadingState label="Loading admin dashboard" />;

  return (
    <motion.div className="page-stack" {...motionProps}>
      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Admin"
          title="Operations overview"
          description="Monitor activity, review institutions, and manage reports."
          actions={
            <>
              <Link className="button button-secondary" to="/admin/requests">
                Review requests
              </Link>
              <Link className="button button-secondary" to="/admin/institutions">
                Review institutions
              </Link>
              <Link className="button button-primary" to="/admin/reports">
                Open reports
              </Link>
            </>
          }
        />
      </motion.section>

      <motion.section {...itemProps}>
        <p className="tier-label">Needs your attention</p>
        <div className="stats-grid">
          <StatCard
            label="Pending institutions"
            value={stats.pending_institutions}
            helper={stats.pending_institutions > 0 ? "Awaiting verification" : "All clear"}
            icon={Building2}
            tone={stats.pending_institutions > 0 ? "warning" : "warning-empty"}
          />
          <StatCard
            label="Pending reports"
            value={stats.pending_reports}
            helper={stats.pending_reports > 0 ? "Flagged content to review" : "No flagged reports"}
            icon={FileClock}
            tone={stats.pending_reports > 0 ? "warning" : "warning-empty"}
          />
        </div>
      </motion.section>

      <motion.section {...itemProps}>
        <p className="tier-label">Platform snapshot</p>
        <div className="stats-grid">
          <StatCard
            label="Users"
            value={stats.total_users}
            helper={
              userBreakdown
                ? `${userBreakdown.members} members \u00b7 ${userBreakdown.institutions} institutions \u00b7 ${userBreakdown.staff} staff`
                : "All registered accounts"
            }
            icon={Users}
            tone="default"
          />
          <StatCard
            label="Total donors"
            value={stats.total_donors}
            helper="Active donor profiles"
            icon={HeartHandshake}
            tone="success"
          />
          <StatCard
            label="Active requests"
            value={stats.active_requests}
            helper="Open for coordination"
            icon={ClipboardCheck}
            tone="accent"
          />
          <StatCard
            label="Active matches"
            value={stats.active_matches}
            helper="Pending or accepted"
            icon={HeartHandshake}
            tone="accent"
          />
        </div>
      </motion.section>

      <motion.section {...itemProps}>
        <div className="content-card">
          <p className="chart-card-title">User roles</p>
          <DonutChart
            segments={donutSegments}
            centerLabel={stats.total_users}
            emptyLabel="No users yet"
          />
          <div className="chart-legend">
            {donutSegments.map((seg) => (
              <div className="chart-legend-item" key={seg.label}>
                <span className="chart-legend-dot" style={{ background: seg.color }} />
                <span className="chart-legend-label">{seg.label}</span>
                <span className="chart-legend-value">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {donors && (
        <motion.section {...itemProps}>
          <p className="tier-label">Blood group distribution</p>
          <div className="dashboard-chart-row">
            <DonutChartCard
              title="Donors by blood group"
              segments={donorBloodSegments}
              centerLabel={donors.length}
              emptyLabel="No donors yet"
            />
            {requests && (
              <DonutChartCard
                title="Requests by blood group"
                segments={requestBloodSegments}
                centerLabel={requests.length}
                emptyLabel="No requests yet"
              />
            )}
          </div>
        </motion.section>
      )}

      {donors && topCities.length > 0 && (
        <motion.section {...itemProps}>
          <div className="content-card">
            <p className="chart-card-title">Top cities</p>
            {topCities.map(([city, count]) => (
              <div className="city-bar-row" key={city}>
                <span className="city-bar-label">{city}</span>
                <div className="city-bar-track">
                  <div
                    className="city-bar-fill"
                    style={{ width: `${(count / maxCityCount) * 100}%` }}
                  />
                </div>
                <span className="city-bar-value">{count}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {requests && (
        <motion.section {...itemProps}>
          <p className="tier-label">Request breakdown</p>
          <div className="dashboard-chart-row">
            <DonutChartCard
              title="Request status"
              segments={statusSegments}
              centerLabel={requests.length}
              emptyLabel="No requests yet"
            />
            <DonutChartCard
              title="Urgency levels"
              segments={urgencySegments}
              centerLabel={requests.length}
              emptyLabel="No requests yet"
            />
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
