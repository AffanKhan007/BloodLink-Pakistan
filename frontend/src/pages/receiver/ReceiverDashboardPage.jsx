import { ClipboardList, Droplets, HeartHandshake, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import { staggerContainer, staggerItem } from "../../components/PageTransition";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

export default function ReceiverDashboardPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const prefersReduced = useReducedMotion();
  const motionProps = useMemo(() => prefersReduced ? {} : {
    variants: staggerContainer,
    initial: "initial",
    animate: "animate",
  }, [prefersReduced]);
  const itemProps = useMemo(() => prefersReduced ? {} : { variants: staggerItem }, [prefersReduced]);

  useEffect(() => {
    apiRequest("/requests", { token })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading receiver dashboard" />;

  return (
    <motion.div className="page-stack" {...motionProps}>
      <motion.section className="stats-grid" {...itemProps}>
        <StatCard label="Total requests" value={requests.length} helper="Owned by you" icon={ClipboardList} tone="default" />
        <StatCard
          label="Active requests"
          value={requests.filter((item) => ["approved", "matched"].includes(item.status)).length}
          helper="Open for coordination"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard label="Fulfilled" value={requests.filter((item) => item.status === "fulfilled").length} helper="Closed successfully" icon={Droplets} tone="accent" />
        <StatCard
          label="Confirmed donors"
          value={requests.reduce((sum, item) => sum + item.confirmed_donor_count, 0)}
          helper="Across all requests"
          icon={HeartHandshake}
          tone="warning"
        />
      </motion.section>

      <motion.section className="content-card" {...itemProps}>
        <SectionIntro
          eyebrow="Requests"
          title="My requests"
          actions={
            <>
              <Link className="button button-secondary" to="/receiver/available-donors">
                Browse public donors
              </Link>
              <Link className="button button-primary" to="/receiver/create-request">
                New request
              </Link>
            </>
          }
        />
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Create a request to begin matching." />
        ) : (
          <div className="card-list">
            {requests.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} footer={`${request.confirmed_donor_count} confirmed donors`} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
