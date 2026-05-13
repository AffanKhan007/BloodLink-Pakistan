import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import FilterToolbar from "../../components/FilterToolbar";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function DonorsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const loadDonors = async () => {
    const data = await apiRequest("/admin/donors", { token });
    setDonors(data);
  };

  useEffect(() => {
    loadDonors().finally(() => setLoading(false));
  }, [token]);

  const applyAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "block") {
      await apiRequest(`/admin/users/${pendingAction.userId}/block`, { method: "PATCH", token });
    } else {
      await apiRequest(`/admin/donors/${pendingAction.donorId}/verify`, {
        method: "PATCH",
        token,
        body: { verification_status: pendingAction.type },
      });
    }
    setPendingAction(null);
    await loadDonors();
  };

  const deferredSearch = useDeferredValue(search);
  const cityOptions = useMemo(() => {
    const uniqueCities = [...new Set(donors.map((donor) => donor.city).filter(Boolean))];
    return [{ value: "all", label: "All cities" }, ...uniqueCities.map((city) => ({ value: city, label: city }))];
  }, [donors]);

  const filteredDonors = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return donors.filter((donor) => {
      const matchesQuery =
        !query ||
        [donor.user.full_name, donor.blood_group, donor.city, donor.area]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "all" || donor.verification_status === statusFilter;
      const matchesCity = cityFilter === "all" || donor.city === cityFilter;
      return matchesQuery && matchesStatus && matchesCity;
    });
  }, [cityFilter, deferredSearch, donors, statusFilter]);

  if (loading) return <LoadingState label="Loading donors" />;
  if (donors.length === 0) return <EmptyState title="No donor profiles" description="Donor profiles will appear here after registration." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Donor moderation"
          title="Review donor readiness"
          description="Search and filter donor profiles by city and verification state before approving, rejecting, or blocking access."
        />
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search donor, blood group, city, or area"
          summary={
            <span className="toolbar-result">
              <Search size={15} />
              {filteredDonors.length} donor{filteredDonors.length === 1 ? "" : "s"} shown
            </span>
          }
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "blocked", label: "Blocked" },
              ],
            },
            {
              label: "City",
              value: cityFilter,
              onChange: setCityFilter,
              options: cityOptions,
            },
          ]}
        />
      </section>

      {filteredDonors.length === 0 ? (
        <EmptyState title="No donors match those filters" description="Try broadening the city or verification state to see more donor profiles." />
      ) : (
        <div className="stacked-cards">
          {filteredDonors.map((donor) => (
            <div className="info-card" key={donor.id}>
              <div className="list-row">
                <div>
                  <strong>{donor.user.full_name}</strong>
                  <p>
                    {donor.blood_group} / {donor.city}, {donor.area}
                  </p>
                </div>
                <StatusBadge value={donor.verification_status} />
              </div>
              <div className="inline-pills">
                <span className="pill pill-soft">
                  <ShieldCheck size={14} />
                  Availability: {donor.availability_status}
                </span>
                <span className="pill pill-soft">
                  <SlidersHorizontal size={14} />
                  Age {donor.age}
                </span>
              </div>
              <div className="card-actions">
                <button className="button button-primary" onClick={() => setPendingAction({ type: "approved", donorId: donor.id })}>
                  Approve
                </button>
                <button className="button button-secondary" onClick={() => setPendingAction({ type: "rejected", donorId: donor.id })}>
                  Reject
                </button>
                <button className="button button-secondary" onClick={() => setPendingAction({ type: "block", donorId: donor.id, userId: donor.user.id })}>
                  Block
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingAction)}
        title="Confirm donor action"
        description="Use rejection for profile review failures, and blocking only for suspicious or unsafe accounts."
        confirmLabel="Confirm action"
        onCancel={() => setPendingAction(null)}
        onConfirm={applyAction}
        tone={pendingAction?.type === "approved" ? "primary" : "danger"}
      />
    </div>
  );
}
