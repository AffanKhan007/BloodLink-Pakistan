import { Bell, HeartHandshake, Search, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
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

export default function DonorDashboardPage() {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", profile: null, requests: [], matches: [], notifications: [] });
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
      apiRequest("/donors/profile/me", { token }),
      apiRequest("/donors/matching-requests", { token }),
      apiRequest("/matches/me", { token }),
      apiRequest("/notifications", { token }),
    ]).then((results) => {
      if (!mounted) return;
      setState({
        loading: false,
        error: results.some((item) => item.status === "rejected") ? "Some dashboard data could not be loaded yet." : "",
        profile: results[0].status === "fulfilled" ? results[0].value : null,
        requests: results[1].status === "fulfilled" ? results[1].value : [],
        matches: results[2].status === "fulfilled" ? results[2].value : [],
        notifications: results[3].status === "fulfilled" ? results[3].value : [],
      });
    });
    return () => {
      mounted = false;
    };
  }, [token]);

  if (state.loading) return <LoadingState label="Loading donor dashboard" />;

  return (
    <motion.div className="page-stack" {...motionProps}>
      {state.error ? <AlertMessage type="warning">{state.error}</AlertMessage> : null}
      <motion.section className="stats-grid" {...itemProps}>
        <StatCard label="Verification" value={state.profile?.verification_status || "pending"} helper="Admin reviewed" icon={ShieldCheck} tone="success" />
        <StatCard label="Available requests" value={state.requests.length} helper="Based on simple MVP filters" icon={Search} tone="accent" />
        <StatCard label="My matches" value={state.matches.length} helper="Assigned by admin" icon={HeartHandshake} tone="default" />
        <StatCard
          label="Unread notifications"
          value={state.notifications.filter((item) => !item.is_read).length}
          helper="In-app only"
          icon={Bell}
          tone="warning"
        />
      </motion.section>

      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Matching opportunities"
          title="Requests near your profile"
          description="Only approved requests that fit your city and blood group appear here, keeping the donor experience focused."
          actions={
            <>
              <Link className="button button-secondary" to="/donor/profile">
                Update profile
              </Link>
              <Link className="button button-primary" to="/donor/matches">
                Open my matches
              </Link>
            </>
          }
        />
        {state.requests.length === 0 ? (
          <EmptyState title="No matching requests yet" description="Approved requests that fit your city and blood group will appear here." />
        ) : (
          <div className="card-list">
            {state.requests.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} footer={`${request.confirmed_donor_count} confirmed donors so far`} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
