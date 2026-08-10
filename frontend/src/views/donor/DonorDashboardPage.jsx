import { Bell, HeartHandshake, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import { staggerContainer, staggerItem } from "../../components/PageTransition";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

export default function DonorDashboardPage() {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", profile: null, matches: [], notifications: [] });
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
      apiRequest("/matches/me", { token }),
      apiRequest("/notifications", { token }),
    ]).then((results) => {
      if (!mounted) return;
      setState({
        loading: false,
        error: results.some((item) => item.status === "rejected") ? "Some dashboard data could not be loaded yet." : "",
        profile: results[0].status === "fulfilled" ? results[0].value : null,
        matches: results[1].status === "fulfilled" ? results[1].value : [],
        notifications: results[2].status === "fulfilled" ? results[2].value : [],
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
        {state.profile ? (
          <StatCard
            label="Donor profile"
            value={state.profile.blood_group}
            helper={`${state.profile.city}${state.profile.area ? ", " + state.profile.area : ""}`}
            icon={MapPin}
            tone="success"
          />
        ) : (
          <StatCard label="Donor profile" value="Not set up" helper="Create one to start donating" icon={MapPin} tone="default" />
        )}
        <StatCard label="My matches" value={state.matches.length} helper="Auto-matched" icon={HeartHandshake} tone="default" />
        <StatCard label="Active matches" value={state.matches.filter((m) => m.status === "pending" || m.status === "accepted").length} helper="Pending or accepted" icon={HeartHandshake} tone="accent" />
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
          eyebrow="Requests"
          title="My matches"
          description="Requests matched to your profile."
          actions={
            <>
              <Link className="button button-secondary" href="/donor/profile">
                Update profile
              </Link>
              <Link className="button button-primary" href="/donor/matches">
                Open my matches
              </Link>
            </>
          }
        />
        {state.matches.length === 0 ? (
          <EmptyState title="No assigned matches yet" description="Matched requests will appear here." />
        ) : (
          <div className="card-list">
            {state.matches.slice(0, 3).map((match) => (
              <div className="info-card" key={match.id}>
                <div className="list-row">
                  <strong>Request #{match.request_id}</strong>
                  <span className="pill pill-soft">{match.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
