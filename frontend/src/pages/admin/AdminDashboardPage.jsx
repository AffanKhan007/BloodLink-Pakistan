import { Building2, ClipboardCheck, FileClock, HeartHandshake, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import DonutChart from "../../components/DonutChart";
import { LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] } },
};

const STAFF_ROLES = new Set([
  "admin", "super_admin", "operations_agent",
  "hospital_admin", "hospital_staff",
  "blood_bank_admin", "blood_bank_staff", "auditor",
]);

const CHART_COLORS = {
  members: "var(--color-info)",
  institutions: "var(--color-success)",
  staff: "var(--color-urgent)",
};

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState(null);
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

  useEffect(() => {
    apiRequest("/admin/dashboard", { token }).then(setStats);
    apiRequest("/admin/users", { token }).then((users) => {
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
  }, [token]);

  if (!stats) return <LoadingState label="Loading admin dashboard" />;

  const donutSegments = userBreakdown
    ? [
        { label: "Members", value: userBreakdown.members, color: CHART_COLORS.members },
        { label: "Institutions", value: userBreakdown.institutions, color: CHART_COLORS.institutions },
        { label: "Staff", value: userBreakdown.staff, color: CHART_COLORS.staff },
      ]
    : [];

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
        <div className="dashboard-split">
          <div className="stats-grid stats-grid-2col">
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
          <div className="content-card dashboard-chart-card">
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
        </div>
      </motion.section>
    </motion.div>
  );
}
