import { BarChart3, Droplets, Percent, TestTubeDiagonal } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

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

export default function BloodBankAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    apiRequest("/api/v1/blood-banks/me/analytics", { token })
      .then(setAnalytics)
      .catch(() => {});
  }, [token]);

  if (!analytics) return <LoadingState label="Loading analytics" />;

  const byBloodGroup = analytics.by_blood_group || [];
  const byMonth = analytics.by_month || [];

  const maxGroupValue = byBloodGroup.length > 0
    ? Math.max(...byBloodGroup.map((g) => g.count || 0), 1)
    : 1;

  const maxMonthValue = byMonth.length > 0
    ? Math.max(...byMonth.map((m) => m.count || 0), 1)
    : 1;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Analytics"
          title="Blood bank performance"
          description="Summary of donations, fulfillment, and inventory metrics."
        />
      </section>

      <section className="stats-grid">
        <StatCard label="Total donations" value={analytics.total_donations ?? 0} icon={Droplets} tone="default" />
        <StatCard label="Fulfillment rate" value={`${analytics.fulfillment_rate ?? 0}%`} icon={Percent} tone="success" />
        <StatCard label="Expiry rate" value={`${analytics.expiry_rate ?? 0}%`} icon={TestTubeDiagonal} tone="warning" />
        <StatCard label="Total requests" value={analytics.total_requests ?? 0} icon={BarChart3} tone="accent" />
      </section>

      {byBloodGroup.length > 0 && (
        <section className="content-card">
          <p className="chart-card-title">Donations by blood group</p>
          {byBloodGroup.map((item) => {
            const color = BLOOD_GROUP_COLORS[item.blood_group] || "#9CA3AF";
            return (
              <div className="city-bar-row" key={item.blood_group}>
                <span className="city-bar-label">{item.blood_group}</span>
                <div className="city-bar-track">
                  <div
                    className="city-bar-fill"
                    style={{ width: `${(item.count / maxGroupValue) * 100}%`, background: color }}
                  />
                </div>
                <span className="city-bar-value">{item.count}</span>
              </div>
            );
          })}
        </section>
      )}

      {byMonth.length > 0 && (
        <section className="content-card">
          <p className="chart-card-title">Donations by month (last 6)</p>
          {byMonth.map((item) => (
            <div className="city-bar-row" key={item.month || item.label}>
              <span className="city-bar-label">{item.label || item.month}</span>
              <div className="city-bar-track">
                <div
                  className="city-bar-fill"
                  style={{ width: `${(item.count / maxMonthValue) * 100}%`, background: "var(--color-info)" }}
                />
              </div>
              <span className="city-bar-value">{item.count}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
