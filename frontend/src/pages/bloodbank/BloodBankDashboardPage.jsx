import { TestTubeDiagonal, Warehouse } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

export default function BloodBankDashboardPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user?.blood_bank_id) return;
    apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/inventory-summary`, { token }).then(setSummary);
  }, [token, user]);

  if (!user?.blood_bank_id) return <EmptyState title="No blood bank scope" description="This account is not linked to a blood bank yet." />;
  if (!summary) return <LoadingState label="Loading blood bank dashboard" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Blood bank dashboard"
          title="Inventory snapshot"
          description="Stock levels and near-expiry inventory overview."
          actions={
            <>
              <Link className="button button-secondary" to="/blood-bank/city-requests">
                View city requests
              </Link>
              <Link className="button button-primary" to="/blood-bank/inventory">
                Manage inventory
              </Link>
            </>
          }
        />
      </section>
      <section className="stats-grid">
        <StatCard label="Blood bank" value={summary.blood_bank.name} helper={summary.blood_bank.city} icon={Warehouse} tone="default" />
        <StatCard label="Tracked units" value={summary.total_units} helper="Across all stock records" icon={TestTubeDiagonal} tone="accent" />
        <StatCard label="Available units" value={summary.available_units} helper="Ready for coordination" icon={Warehouse} tone="success" />
        <StatCard label="Reserved units" value={summary.reserved_units} helper="Held for requests" icon={Warehouse} tone="warning" />
      </section>
    </div>
  );
}
