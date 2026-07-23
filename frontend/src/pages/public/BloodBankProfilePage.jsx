import { ArrowLeft, Clock, Eye, MapPin, Phone, ShieldCheck, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import GovtVerifiedBadge from "../../components/GovtVerifiedBadge";
import PageTransition from "../../components/PageTransition";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CAPACITY_PER_GROUP = 50;

function inventoryBarClass(available) {
  if (available === 0) return "inventory-bar-fill-empty";
  if (available <= 5) return "inventory-bar-fill-critical";
  if (available <= 15) return "inventory-bar-fill-low";
  return "inventory-bar-fill-available";
}

function inventoryBarWidth(available) {
  if (available === 0) return "0%";
  const pct = Math.min((available / CAPACITY_PER_GROUP) * 100, 100);
  return `${pct}%`;
}

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
              {bank.verified_at ? <ShieldCheck size={18} style={{ color: "var(--color-success)" }} /> : null}
              <GovtVerifiedBadge govtVerified={bank.govt_verified} />
            </span>
          }
          description={[bank.area, bank.city].filter(Boolean).join(", ") || undefined}
          actions={<Link className="button button-tertiary" to="/blood-banks"><ArrowLeft size={14} /> Back to list</Link>}
        />

        <div className="stats-grid">
          <StatCard label="Total units" value={inventory?.total_units ?? "\u2014"} tone="default" />
          <StatCard label="Available" value={inventory?.available_units ?? "\u2014"} tone="available" />
          <StatCard label="Reserved" value={inventory?.reserved_units ?? "\u2014"} tone="pending" />
          <StatCard label="Expiring soon" value={inventory?.expiring_soon_units ?? "\u2014"} tone="critical" />
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
              <p style={{ margin: 0, color: "var(--text-muted)" }}>{bank.description}</p>
            ) : null}
          </div>
        </div>

        <div className="content-card">
          <h3 style={{ margin: "0 0 0.75rem" }}>Blood group availability</h3>
          <div className="inventory-bar-group">
            {BLOOD_GROUPS.map((group) => {
              const unit = unitMap[group];
              const available = unit?.available_units ?? 0;
              const expiring = unit?.expiring_soon_units ?? 0;
              return (
                <div className="inventory-bar-row" key={group}>
                  <span className="inventory-bar-label">{group}</span>
                  <div className="inventory-bar-track">
                    <div
                      className={`inventory-bar-fill ${inventoryBarClass(available)}`}
                      style={{ width: inventoryBarWidth(available) }}
                    />
                  </div>
                  <span className={`inventory-bar-count ${available === 0 ? "inventory-bar-count-zero" : ""}`}>
                    {available}{expiring > 0 ? ` (${expiring} exp.)` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="content-card">
          <div className="list-row">
            <Utensils size={14} />
            <span style={{ color: "var(--text-muted)" }}>No upcoming blood drives scheduled.</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
