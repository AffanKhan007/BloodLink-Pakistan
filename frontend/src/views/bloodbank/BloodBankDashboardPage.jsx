import { AlertTriangle, BarChart3, Calendar, CalendarClock, CheckCircle2, ClipboardList, Droplets, Megaphone, Settings, TestTubeDiagonal, Warehouse } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function BloodBankDashboardPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [slots, setSlots] = useState([]);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [summaryData, slotsData, requestsData, analyticsData] = await Promise.all([
        apiRequest(`/api/v1/blood-banks/${user?.blood_bank_id}/inventory-summary`, { token }),
        apiRequest("/api/v1/blood-banks/me/slots", { token }),
        apiRequest("/api/v1/blood-banks/me/city-requests", { token }),
        apiRequest("/api/v1/blood-banks/me/analytics", { token }),
      ]);
      setSummary(summaryData);
      setSlots(slotsData);
      setRequests(requestsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!user?.blood_bank_id) return;
    loadData();
  }, [token, user]);

  if (!user?.blood_bank_id) return <EmptyState title="No blood bank scope" description="This account is not linked to a blood bank yet." />;
  if (!summary) return <LoadingState label="Loading blood bank dashboard" />;

  const todaySlots = (slots || []).filter((s) => isToday(s.slot_date));
  const lowStockGroups = (summary.by_group || BLOOD_GROUPS).filter(
    (g) => g.units_available === 0
  );

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Blood bank dashboard"
          title={summary.blood_bank?.name || "Blood bank"}
          description="Inventory, appointments, and city fulfillment in one view."
          actions={
            <>
              <Link className="button button-secondary" href="/blood-bank/inventory">
                Inventory
              </Link>
              <Link className="button button-primary" href="/blood-bank/city-requests">
                City requests
              </Link>
            </>
          }
        />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>

      <section className="stats-grid">
        <StatCard label="Total units" value={summary.total_units} helper="Across all stock records" icon={Warehouse} tone="default" />
        <StatCard label="Available" value={summary.available_units} helper="Ready for coordination" icon={TestTubeDiagonal} tone="success" />
        <StatCard label="Reserved" value={summary.reserved_units} helper="Held for requests" icon={CalendarClock} tone="warning" />
        <StatCard label="Expiring soon" value={summary.expiring_soon_units} helper="Within 7 days" icon={AlertTriangle} tone={summary.expiring_soon_units > 0 ? "urgent" : "default"} />
      </section>

      {lowStockGroups.length > 0 && (
        <section className="content-card">
          <SectionIntro
            eyebrow="Needs attention"
            title="Low stock alert"
            description="These blood groups have zero available units."
            compact
          />
          <div className="inline-pills">
            {lowStockGroups.map((g) => (
              <span className="pill" key={g.blood_group || g}>
                {g.blood_group || g}: {g.units_available ?? 0} available
              </span>
            ))}
          </div>
          {summary.expiring_soon_units > 0 && (
            <p style={{ marginTop: "0.5rem" }}>
              <AlertTriangle size={13} /> {summary.expiring_soon_units} unit{summary.expiring_soon_units === 1 ? "" : "s"} expiring within 7 days
            </p>
          )}
        </section>
      )}

      <section className="content-card">
        <SectionIntro
          eyebrow="Schedule"
          title="Today's appointments"
          description={`${todaySlots.length} slot${todaySlots.length === 1 ? "" : "s"} scheduled for today`}
          compact
        />
        {todaySlots.length === 0 ? (
          <p>No slots scheduled for today.</p>
        ) : (
          <div className="card-list">
            {todaySlots.map((slot) => (
              <div className="info-card" key={slot.id}>
                <div className="list-row">
                  <div>
                    <strong>{new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                    <p>{slot.booked_count ?? 0} / {slot.max_donors} donors booked</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-card">
        <SectionIntro
          eyebrow="Fulfillment queue"
          title="Pending city requests"
          description="Requests in your city that need fulfillment."
          compact
        />
        {(requests || []).filter((r) => r.status !== "fulfilled").length === 0 ? (
          <p>All requests fulfilled.</p>
        ) : (
          <div className="card-list">
            {(requests || []).filter((r) => r.status !== "fulfilled").map((request) => (
              <div className="info-card" key={request.id}>
                <div className="list-row">
                  <div>
                    <strong>{request.hospital_name}</strong>
                    <p>{request.blood_group_needed} / {request.units_required} units</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-card">
        <p className="chart-card-title">Quick links</p>
        <div className="grid-form" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          <Link className="button button-secondary" href="/blood-bank/inventory"><Warehouse size={14} /> Inventory</Link>
          <Link className="button button-secondary" href="/blood-bank/city-requests"><ClipboardList size={14} /> City requests</Link>
          <Link className="button button-secondary" href="/blood-bank/drives"><Megaphone size={14} /> Drives</Link>
          <Link className="button button-secondary" href="/blood-bank/appointments"><Calendar size={14} /> Appointments</Link>
          <Link className="button button-secondary" href="/blood-bank/analytics"><BarChart3 size={14} /> Analytics</Link>
          <Link className="button button-secondary" href="/blood-bank/profile"><Settings size={14} /> Profile</Link>
        </div>
      </section>
    </div>
  );
}
