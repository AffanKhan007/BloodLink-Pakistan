import { Bell, ClipboardList, Droplets, HeartHandshake, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

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

  return (
    <div className="page-stack">
      {state.error ? <AlertMessage type="warning">{state.error}</AlertMessage> : null}

      <section className="stats-grid">
        {hasDonorProfile ? (
          <StatCard
            label="Donor status"
            value={state.profile.verification_status || "pending"}
            helper="Admin reviewed"
            icon={ShieldCheck}
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
          helper="Owned by you"
          icon={ClipboardList}
          tone="default"
        />
        {hasDonorProfile ? (
          <StatCard
            label="My matches"
            value={state.matches.length}
            helper="Auto-matched"
            icon={HeartHandshake}
            tone="accent"
          />
        ) : null}
        <StatCard
          label="Notifications"
          value={state.notifications.filter((n) => !n.is_read).length}
          helper="Unread"
          icon={Bell}
          tone="warning"
        />
      </section>

      {hasDonorProfile ? (
        <section className="content-card">
          <SectionIntro
            eyebrow="Donor opportunities"
            title="My matches"
            description="Requests automatically matched to your donor profile."
            actions={
              <Link className="button button-primary" to="/donor/matches">View my matches</Link>
            }
          />
          <div className="stats-mini">
            <StatCard label="Active matches" value={state.matches.filter((m) => m.status === "pending" || m.status === "accepted").length} helper="Pending or accepted" icon={HeartHandshake} tone="accent" />
          </div>
        </section>
      ) : (
        <section className="content-card">
          <SectionIntro
            eyebrow="Become a donor"
            title="Set up your donor profile"
            description="Add blood group, city, and availability."
            actions={
              <Link className="button button-primary" to="/donor/profile">Create donor profile</Link>
            }
          />
        </section>
      )}

      <section className="content-card">
        <SectionIntro
          eyebrow="Requests"
          title="Your blood requests"
          description="Create and track patient requests."
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
      </section>
    </div>
  );
}
