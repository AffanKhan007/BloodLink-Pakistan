import { Building2, ClipboardList, Droplets, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import RequestCard from "../../components/RequestCard";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

export default function HospitalDashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user?.hospital_id) return;
    apiRequest(`/api/v1/hospitals/${user.hospital_id}/dashboard`, { token }).then(setData);
  }, [token, user]);

  if (!user?.hospital_id) {
    return <EmptyState title="No hospital scope" description="This staff account is not assigned to a hospital yet." />;
  }
  if (!data) return <LoadingState label="Loading hospital dashboard" />;

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Hospital" value={data.hospital.name} helper={data.hospital.city} icon={Building2} tone="default" />
        <StatCard label="Total requests" value={data.total_requests} helper="Hospital-created demand" icon={ClipboardList} tone="accent" />
        <StatCard label="Active requests" value={data.active_requests} helper="Approved or matched" icon={ShieldCheck} tone="warning" />
        <StatCard label="Fulfilled requests" value={data.fulfilled_requests} helper="Closed requests" icon={Droplets} tone="success" />
      </section>
      <section className="content-card">
        <SectionIntro
          eyebrow="Hospital demand"
          title="Recent requests"
          description="Hospital-created requests and their current status."
        />
        {data.requests.length === 0 ? (
          <EmptyState title="No hospital requests yet" description="Create a verified request from the hospital portal." />
        ) : (
          <div className="card-list">
            {data.requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
