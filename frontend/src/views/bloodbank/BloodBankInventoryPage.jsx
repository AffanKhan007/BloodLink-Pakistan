import { CalendarClock, Clock3, Search, ShieldCheck, TestTubeDiagonal, Warehouse } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import FilterToolbar from "../../components/FilterToolbar";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";

function getTimeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const initialForm = {
  donor_profile_id: "",
  blood_group: "A+",
  units_available: 1,
  component_type: "whole_blood",
  collected_at: "",
  expires_at: "",
  testing_status: "pending",
  status: "collected",
  storage_location: "",
};

export default function BloodBankInventoryPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [quickStock, setQuickStock] = useState({});

  const loadSummary = async () => {
    if (!user?.blood_bank_id) return;
    const data = await apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/inventory-summary`, { token });
    setSummary(data);
    const initialQuick = {};
    BLOOD_GROUPS.forEach((bg) => {
      const found = (data.by_group || []).find((g) => g.blood_group === bg);
      initialQuick[bg] = found?.units_available ?? 0;
    });
    setQuickStock(initialQuick);
  };

  useEffect(() => {
    loadSummary();
  }, [token, user]);

  const handleQuickStock = async () => {
    setMessage("");
    setError("");
    try {
      const units = BLOOD_GROUPS.map((bg) => ({
        blood_group: bg,
        units_available: Number(quickStock[bg]) || 0,
      }));
      await apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/quick-stock`, {
        method: "POST",
        token,
        body: { units },
      });
      setMessage("Stock updated successfully.");
      await loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/v1/blood-banks/${user.blood_bank_id}/blood-units`, {
        method: "POST",
        token,
        body: {
          ...form,
          donor_profile_id: form.donor_profile_id ? Number(form.donor_profile_id) : null,
          collected_at: new Date(form.collected_at).toISOString(),
          expires_at: new Date(form.expires_at).toISOString(),
        },
      });
      setMessage("Blood unit created.");
      setForm(initialForm);
      await loadSummary();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const deferredSearch = useDeferredValue(search);
  const filteredUnits = useMemo(() => {
    if (!summary) return [];
    const query = deferredSearch.trim().toLowerCase();
    return summary.units.filter((unit) => {
      const matchesQuery =
        !query ||
        [unit.unit_code, unit.blood_group, unit.component_type, unit.storage_location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
      const matchesGroup = groupFilter === "all" || unit.blood_group === groupFilter;
      return matchesQuery && matchesStatus && matchesGroup;
    });
  }, [deferredSearch, groupFilter, statusFilter, summary]);

  if (!user?.blood_bank_id) {
    return <EmptyState title="No blood bank scope" description="This staff account is not assigned to a blood bank yet." />;
  }
  if (!summary) return <LoadingState label="Loading blood bank inventory" />;

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Blood bank" value={summary.blood_bank.name} helper={summary.blood_bank.city} icon={Warehouse} tone="default" />
        <StatCard label="Total units" value={summary.total_units} helper="Tracked inventory" icon={TestTubeDiagonal} tone="accent" />
        <StatCard label="Available" value={summary.available_units} helper="Ready for coordination" icon={ShieldCheck} tone="success" />
        <StatCard label="Expiring soon" value={summary.expiring_soon_units} helper="Within 7 days" icon={CalendarClock} tone="warning" />
      </section>

      {summary?.bank?.stock_update_frequency ? (
        <div className="metric-chip">
          <Clock3 size={14} />
          <div>
            <span>Stock last updated</span>
            <strong>{getTimeAgo(summary.bank.stock_update_frequency)}</strong>
          </div>
        </div>
      ) : null}

      <section className="content-card">
        <SectionIntro
          eyebrow="Quick update"
          title="Quick stock update"
          description="Set available counts for each blood group at once."
          compact
        />
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <div
          className="grid-form"
          style={{ gridTemplateColumns: "repeat(4, 1fr)", alignItems: "end" }}
        >
          {BLOOD_GROUPS.map((bg) => (
            <label key={bg}>
              {bg}
              <input
                type="number"
                min="0"
                value={quickStock[bg] ?? 0}
                onChange={(e) =>
                  setQuickStock((prev) => ({ ...prev, [bg]: e.target.value }))
                }
              />
            </label>
          ))}
          <div className="form-span">
            <button className="button button-primary" onClick={handleQuickStock}>
              Update stock
            </button>
          </div>
        </div>
      </section>

      <section className="content-card">
        <SectionIntro
          eyebrow="Inventory intake"
          title="Create blood unit"
          description="Capture unit metadata in a way that feels clean for staff and traceable for future workflows."
        />
        <form className="grid-form" onSubmit={handleSubmit}>
          <div className="form-section form-span">
            <div className="form-section-header">
              <h3>Unit intake details</h3>
              <p>Capture unit metadata cleanly so inventory summaries, testing states, and traceability screens stay reliable.</p>
            </div>
          </div>
          <label>
            Donor profile ID
            <input value={form.donor_profile_id} onChange={(event) => setForm((current) => ({ ...current, donor_profile_id: event.target.value }))} />
          </label>
          <label className="field-required">
            Blood group
            <select value={form.blood_group} onChange={(event) => setForm((current) => ({ ...current, blood_group: event.target.value }))}>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="field-required">
            Units available
            <input
              type="number"
              min="1"
              max="100"
              value={form.units_available}
              onChange={(event) => setForm((current) => ({ ...current, units_available: Number(event.target.value) }))}
              required
            />
          </label>
          <label className="field-required">
            Component type
            <input value={form.component_type} onChange={(event) => setForm((current) => ({ ...current, component_type: event.target.value }))} required />
          </label>
          <label className="field-required">
            Collected at
            <input type="datetime-local" value={form.collected_at} onChange={(event) => setForm((current) => ({ ...current, collected_at: event.target.value }))} required />
          </label>
          <label className="field-required">
            Expires at
            <input type="datetime-local" value={form.expires_at} onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))} required />
          </label>
          <div className="form-section form-span">
            <div className="form-section-header">
              <h3>Testing and storage</h3>
              <p>Use clear testing and storage details so staff can understand immediately whether a unit is ready, pending, or reserved.</p>
            </div>
          </div>
          <label>
            Testing status
            <select value={form.testing_status} onChange={(event) => setForm((current) => ({ ...current, testing_status: event.target.value }))}>
              {["pending", "cleared", "failed", "inconclusive"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {["collected", "testing_pending", "cleared", "available", "reserved"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Storage location
            <input value={form.storage_location} onChange={(event) => setForm((current) => ({ ...current, storage_location: event.target.value }))} />
          </label>
          <div className="form-span">
            <button className="button button-primary">Create blood unit</button>
          </div>
        </form>
      </section>

      <section className="content-card">
        <SectionIntro eyebrow="Tracked units" title="Inventory overview" description="Search stock by unit code, blood group, or current inventory status." />
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search unit code, blood group, component, or location"
          summary={
            <span className="toolbar-result">
              <Search size={13} />
              {filteredUnits.length} unit{filteredUnits.length === 1 ? "" : "s"} shown
            </span>
          }
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All statuses" },
                { value: "available", label: "Available" },
                { value: "reserved", label: "Reserved" },
                { value: "testing_pending", label: "Testing pending" },
                { value: "collected", label: "Collected" },
                { value: "cleared", label: "Cleared" },
              ],
            },
            {
              label: "Blood group",
              value: groupFilter,
              onChange: setGroupFilter,
              options: [
                { value: "all", label: "All groups" },
                ...BLOOD_GROUPS.map((group) => ({ value: group, label: group })),
              ],
            },
          ]}
        />
        {summary.units.length === 0 ? (
          <EmptyState title="No units yet" description="Create blood units to begin inventory traceability." />
        ) : filteredUnits.length === 0 ? (
          <EmptyState title="No units match those filters" description="Try a broader status or search term to bring more inventory into view." />
        ) : (
          <div className="stacked-cards">
            {filteredUnits.map((unit) => (
              <div className="info-card" key={unit.id}>
                <div className="list-row">
                  <div>
                    <strong>{unit.unit_code}</strong>
                    <p>
                      {unit.blood_group} / {unit.component_type}
                    </p>
                  </div>
                  <StatusBadge value={unit.status} />
                </div>
                <div className="inline-pills">
                  <span className="pill pill-soft">{unit.units_available} units</span>
                  <span className="pill pill-soft">
                    <Warehouse size={12} />
                    {unit.storage_location || "Storage pending"}
                  </span>
                </div>
                <div className="card-actions">
                  <StatusBadge value={unit.testing_status} />
                  <Link className="button button-secondary" href={`/blood-bank/units/${unit.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
