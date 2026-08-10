import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiRequest } from "../../api/client";
import FilterToolbar from "../../components/FilterToolbar";
import GovtVerifiedBadge from "../../components/GovtVerifiedBadge";
import PageTransition from "../../components/PageTransition";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";

export default function BloodBankBrowsePage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest("/api/v1/blood-banks/public")
      .then((data) => {
        if (!cancelled) setBanks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const cities = useMemo(() => {
    const set = new Set(banks.map((b) => b.city).filter(Boolean));
    return ["All cities", ...Array.from(set).sort()];
  }, [banks]);

  const filtered = useMemo(() => {
    let list = banks;
    if (cityFilter && cityFilter !== "All cities") {
      list = list.filter((b) => b.city === cityFilter);
    }
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.area?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [banks, citySearch, cityFilter]);

  return (
    <PageTransition>
      <div className="page-stack">
        <SectionIntro
          eyebrow="Blood Banks"
          title="Find blood banks near you"
          description="Browse verified blood banks, check live stock availability, and get contact details."
        />

        <FilterToolbar
          searchValue={citySearch}
          onSearchChange={setCitySearch}
          searchPlaceholder="Search by name, city, or area..."
          summary={`${filtered.length} blood bank${filtered.length !== 1 ? "s" : ""}`}
          filters={[
            {
              label: "City",
              value: cityFilter,
              onChange: setCityFilter,
              options: cities.map((c) => ({ label: c, value: c === "All cities" ? "" : c })),
            },
          ]}
        />

        {loading ? (
          <LoadingState label="Loading blood banks" description="Fetching verified blood banks..." />
        ) : error ? (
          <EmptyState title="Something went wrong" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No blood banks found" description="Try adjusting your search or filter criteria." />
        ) : (
          <div className="request-grid">
            {filtered.map((bank) => (
              <div className="info-card" key={bank.id}>
                <div className="radar-result-header">
                  <h3>{bank.name}</h3>
                  {bank.verified_at ? (
                    <span className="pill pill-soft" title="Verified">
                      <ShieldCheck size={13} />
                    </span>
                  ) : null}
                  <GovtVerifiedBadge govtVerified={bank.govt_verified} />
                </div>
                <div className="list-row">
                  <span className="meta-label">
                    <MapPin size={13} />
                    {[bank.area, bank.city].filter(Boolean).join(", ") || "\u2014"}
                  </span>
                </div>
                {bank.operating_hours ? (
                  <div className="list-row">
                    <span className="meta-label">{bank.operating_hours}</span>
                  </div>
                ) : null}
                <div className="inline-pills">
                  {bank.public_stock_visible ? (
                    <span className="pill pill-soft">
                      {bank.available_units ?? "\u2014"} units available
                    </span>
                  ) : null}
                  {bank.expiring_soon_units > 0 ? (
                    <span className="pill pill-soft">{bank.expiring_soon_units} expiring soon</span>
                  ) : null}
                </div>
                <div className="radar-result-actions">
                  <Link className="button button-secondary button-full" href={`/blood-banks/${bank.id}`}>
                    View profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
