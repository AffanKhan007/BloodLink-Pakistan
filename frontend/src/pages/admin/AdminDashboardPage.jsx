import { Building2, ClipboardCheck, Droplets, FileClock, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
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

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

  useEffect(() => {
    apiRequest("/admin/dashboard", { token }).then(setStats);
  }, [token]);

  if (!stats) return <LoadingState label="Loading admin dashboard" />;

  return (
    <motion.div className="page-stack" {...motionProps}>
      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Overview"
          title="Platform operations snapshot"
          description="Watch the request lifecycle, donor verification load, and moderation work from a calmer admin control center."
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
      <motion.section className="stats-grid" {...itemProps}>
        <StatCard label="Users" value={stats.total_users} helper="All roles" icon={Users} tone="default" />
        <StatCard label="Approved donors" value={stats.approved_donors} helper={`${stats.total_donors} total donors`} icon={ShieldCheck} tone="success" />
        <StatCard label="Pending institutions" value={stats.pending_institutions} helper="Needs approval review" icon={Building2} tone="warning" />
        <StatCard label="Pending requests" value={stats.pending_requests} helper="Needs admin review" icon={Droplets} tone="warning" />
        <StatCard label="Active matches" value={stats.active_matches} helper="Pending or accepted" icon={HeartHandshake} tone="accent" />
        <StatCard label="Approved requests" value={stats.approved_requests} helper="Open for coordination" icon={ClipboardCheck} tone="success" />
        <StatCard label="Pending reports" value={stats.pending_reports} helper="Needs review" icon={FileClock} tone="warning" />
      </motion.section>
    </motion.div>
  );
}
