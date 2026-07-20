import { ArrowLeft, Clock, Eye, MapPin, ShieldCheck, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import PageTransition from "../../components/PageTransition";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodBankProfilePage() {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiRequest(`/api/v1/blood-banks/public/${id}`),
      apiRequest(`/api/v1/blood-banks/${id}/inventory-summary`),
    ])
      .then(([bankData, invData]) => {
        if (!cancelled) {
          setBank(bankData);
          setInventory(invData);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="page-stack">
          <LoadingState label="Loading blood bank" description="Fetching profile and inventory..." />
        </div>
      </PageTransition>
    );
  }

  if (error || !bank) {
    return (
      <PageTransition>
        <div className="page-stack">
          <EmptyState title="Blood bank not found" description={error || "This blood bank may no longer be available."} />
        </div>
      </PageTransition>
    );
  }

  const unitMap = {};
  if (inventory?.units) {
    inventory.units.forEach((u) => {
      unitMap[u.blood_group] = u;
    });
  }

  return (
    <PageTransition>
      <div className="page-stack">
        <SectionIntro
          eyebrow={bank.city || "Blood Bank"}
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              {bank.name}
              {bank.verified_at ? <ShieldCheck size={18} style={{ color: "var(--accent)" }} /> : null}
            </span>
          }
          description={[bank.area, bank.city].filter(Boolean).join(", ") || undefined}
          actions={<Link className="button button-tertiary" to="/blood-banks"><ArrowLeft size={14} /> Back to list</Link>}
        />

        <div className="stats-grid">
          <StatCard label="Total units" value={inventory?.total_units ?? "—"} tone="default" />
          <StatCard label="Available" value={inventory?.available_units ?? "—"} tone="available" />
          <StatCard label="Reserved" value={inventory?.reserved_units ?? "—"} tone="pending" />
          <StatCard label="Expiring soon" value={inventory?.expiring_soon_units ?? "—"} tone="critical" />
        </div>

        <div className="content-card">
          <div className="stacked-cards">
            <div className="list-row">
              <MapPin size={14} />
              <span>{bank.address || "Address not provided"}</span>
            </div>

            {bank.operating_hours ? (
              <div className="list-row">
                <Clock size={14} />
                <span>{bank.operating_hours}</span>
              </div>
            ) : null}

            <div className="list-row">
              {showContact ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <Phone size={14} />
                  {bank.contact_number || "Not available"}
                </span>
              ) : (
                <button className="button button-secondary" onClick={() => setShowContact(true)}>
                  <Eye size={14} /> Show contact
                </button>
              )}
            </div>

            {bank.description ? (
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{bank.description}</p>
            ) : null}
          </div>
        </div>

        <div className="content-card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Blood group availability</h3>
          <div className="request-grid">
            {BLOOD_GROUPS.map((group) => {
              const unit = unitMap[group];
              const available = unit?.available_units ?? 0;
              const expiring = unit?.expiring_soon_units ?? 0;
              return (
                <div
                  className={`info-card${expiring > 0 ? " card-highlight" : ""}`}
                  key={group}
                  style={{ textAlign: "center" }}
                >
                  <p className="meta-label" style={{ marginBottom: "0.25rem" }}>{group}</p>
                  <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{available}</h3>
                  {expiring > 0 ? (
                    <span className="pill pill-soft" style={{ marginTop: "0.25rem" }}>
                      {expiring} expiring soon
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="content-card">
          <div className="list-row">
            <Utensils size={14} />
            <span style={{ color: "var(--text-secondary)" }}>No upcoming blood drives scheduled.</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
