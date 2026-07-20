import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Search,
  Crosshair,
  Users,
  Building2,
  CalendarHeart,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import CityCombobox from "../../components/CityCombobox";
import GovtVerifiedBadge from "../../components/GovtVerifiedBadge";
import PageTransition from "../../components/PageTransition";
import SectionIntro from "../../components/SectionIntro";
import { EmptyState, LoadingState } from "../../components/PageState";

const LAHORE_CENTER = [31.52, 74.35];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RadarMap = lazy(() => import("../../components/RadarMap"));

function bankIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    html: `<div style="width:28px;height:36px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="#dc2626"/><circle cx="14" cy="13" r="6" fill="#fff" opacity="0.9"/><text x="14" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#dc2626">B</text></svg></div>`,
  });
}

function donorIcon() {
  return L.divIcon({
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    html: `<div style="width:24px;height:32px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="#2563eb"/><circle cx="12" cy="11" r="5" fill="#fff" opacity="0.9"/><text x="12" y="14" text-anchor="middle" font-size="8" font-weight="700" fill="#2563eb">D</text></svg></div>`,
  });
}

function driveIcon() {
  return L.divIcon({
    className: "",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -34],
    html: `<div style="width:26px;height:34px;display:flex;align-items:flex-end;justify-content:center"><svg viewBox="0 0 26 34" width="26" height="34"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.82 20.18 0 13 0z" fill="#16a34a"/><circle cx="13" cy="12" r="5.5" fill="#fff" opacity="0.9"/><text x="13" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="#16a34a">♥</text></svg></div>`,
  });
}

function jitter(val, idx) {
  return val + (idx % 5 - 2) * 0.0008;
}

function CollapsibleCard({ icon: Icon, title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="content-card">
      <button
        type="button"
        className="filter-row"
        style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: "0.75rem 1rem" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon size={16} />
          <strong>{title}</strong>
          <span className="pill pill-soft">{count}</span>
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open ? <div style={{ padding: "0 1rem 1rem" }}>{children}</div> : null}
    </div>
  );
}

function ContactButton({ number }) {
  const [revealed, setRevealed] = useState(false);
  if (!number) return null;
  if (revealed) {
    return (
      <a className="button button-primary button-full" href={`tel:${number}`} style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
        <Phone size={13} />
        Call {number}
      </a>
    );
  }
  return (
    <button className="button button-secondary button-full" type="button" onClick={() => setRevealed(true)} style={{ marginTop: "0.5rem" }}>
      <Phone size={13} style={{ marginRight: "0.35rem" }} />
      Show contact
    </button>
  );
}

export default function BloodRadarPage() {
  const { token, user } = useAuth();

  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || "");
  const [city, setCity] = useState(user?.city || "");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const didAutoLocate = useRef(false);

  const fetchRadar = useCallback(
    async (bg, cty, lat, lng) => {
      if (!bg || !cty) return;
      setLoading(true);
      setError("");
      setHasSearched(true);
      try {
        const params = new URLSearchParams({ blood_group: bg, city: cty });
        if (lat != null && lng != null) {
          params.set("lat", String(lat));
          params.set("lng", String(lng));
        }
        const data = await apiRequest(`/api/v1/blood-radar?${params.toString()}`, { token });
        setResults(data);
        if (lat != null && lng != null) {
          setCoords({ lat, lng });
        } else if (data.user_lat && data.user_lng) {
          setCoords({ lat: data.user_lat, lng: data.user_lng });
        }
      } catch (err) {
        setError(err.message);
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (didAutoLocate.current) return;
    if (!bloodGroup || !city) return;
    didAutoLocate.current = true;

    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchRadar(bloodGroup, city, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLocating(false);
          fetchRadar(bloodGroup, city);
        },
        { timeout: 5000 }
      );
    } else {
      fetchRadar(bloodGroup, city);
    }
  }, [bloodGroup, city, fetchRadar]);

  const handleLocate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (bloodGroup && city) {
          fetchRadar(bloodGroup, city, pos.coords.latitude, pos.coords.longitude);
        }
      },
      () => {
        setLocating(false);
      },
      { timeout: 5000 }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (bloodGroup && city) {
      fetchRadar(bloodGroup, city, coords?.lat, coords?.lng);
    }
  };

  const banks = results?.blood_banks || [];
  const donors = results?.donors || [];
  const drives = results?.drives || [];
  const totalCount = banks.length + donors.length + drives.length;

  const mapCenter = useMemo(() => {
    if (coords) return [coords.lat, coords.lng];
    return LAHORE_CENTER;
  }, [coords]);

  const mapMarkers = useMemo(() => {
    const markers = [];
    banks.forEach((b, i) => {
      if (b.latitude && b.longitude) {
        markers.push({ key: `bank-${b.id}`, pos: [b.latitude, b.longitude], icon: bankIcon(), popup: b.name });
      }
    });
    donors.forEach((d, i) => {
      if (d.latitude && d.longitude) {
        markers.push({
          key: `donor-${d.anon_id}`,
          pos: [jitter(d.latitude, i), jitter(d.longitude, i + 3)],
          icon: donorIcon(),
          popup: d.anon_id,
        });
      }
    });
    drives.forEach((dr, i) => {
      if (dr.latitude && dr.longitude) {
        markers.push({ key: `drive-${dr.id}`, pos: [dr.latitude, dr.longitude], icon: driveIcon(), popup: dr.title });
      }
    });
    return markers;
  }, [banks, donors, drives]);

  const showMap = mapMarkers.length > 0;

  const noResults = hasSearched && !loading && totalCount === 0 && !error;

  return (
    <PageTransition>
      <div className="page-stack">
        <SectionIntro
          eyebrow="Blood Radar"
          title="Find blood banks, donors, and drives near you"
          description="Search by blood group and city to see ranked results on a map and in lists sorted by proximity."
        />

        <form className="content-card" onSubmit={handleSearch}>
          <div className="grid-form">
            <div className="form-span-1">
              <label className="meta-label">Blood group</label>
              <select className="city-combo-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="form-span-1">
              <label className="meta-label">City</label>
              <CityCombobox value={city} onChange={setCity} required />
            </div>
            <div className="form-span-2" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <button className="button button-secondary" type="button" onClick={handleLocate} disabled={locating} style={{ whiteSpace: "nowrap" }}>
                {locating ? <LoaderCircle size={14} className="spin-icon" /> : <Crosshair size={14} />}
                {locating ? "Locating..." : "Locate me"}
              </button>
              <button className="button button-primary" type="submit" disabled={!bloodGroup || !city || loading} style={{ flex: 1 }}>
                <Search size={14} style={{ marginRight: "0.35rem" }} />
                Search radar
              </button>
            </div>
          </div>
        </form>

        {!hasSearched && !loading && (
          <EmptyState
            icon={MapPin}
            title="Pick a blood group and city"
            description="Use the filters above to search for nearby blood banks, donors, and donation drives."
          />
        )}

        {loading && <LoadingState label="Scanning the radar" description="Searching for nearby matches..." />}

        {error && !loading && (
          <EmptyState icon={MapPin} title="Something went wrong" description={error} />
        )}

        {noResults && (
          <EmptyState
            icon={MapPin}
            title="No nearby matches"
            description={`No nearby matches in ${city} for ${bloodGroup}. You've been added to the city-wide queue.`}
          />
        )}

        {results && !loading && totalCount > 0 && (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-card-red">
                <Building2 size={18} />
                <strong>{banks.length}</strong>
                <span>Blood banks</span>
              </div>
              <div className="stat-card stat-card-blue">
                <Users size={18} />
                <strong>{donors.length}</strong>
                <span>Donors</span>
              </div>
              <div className="stat-card stat-card-green">
                <CalendarHeart size={18} />
                <strong>{drives.length}</strong>
                <span>Drives</span>
              </div>
            </div>

            {showMap && (
              <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ height: "400px", width: "100%" }}>
                  <Suspense
                    fallback={
                      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                        <LoaderCircle size={20} className="spin-icon" />
                      </div>
                    }
                  >
                    <RadarMap center={mapCenter} markers={mapMarkers} />
                  </Suspense>
                </div>
              </div>
            )}

            {banks.length > 0 && (
              <CollapsibleCard icon={Building2} title="Blood banks" count={banks.length} defaultOpen>
                <div className="stacked-cards">
                  {banks.map((b) => (
                    <div className="info-card" key={b.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0 }}>{b.name}</h3>
                        {b.verified ? (
                          <span className="pill pill-soft" title="Verified"><ShieldCheck size={13} /></span>
                        ) : null}
                        <GovtVerifiedBadge govtVerified={b.govt_verified} />
                      </div>
                      <div className="list-row">
                        <span className="meta-label">
                          <MapPin size={13} />
                          {[b.area, b.city].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                      <div className="inline-pills">
                        {b.available_units != null && (
                          <span className="pill pill-soft">{b.available_units} units available</span>
                        )}
                        {b.distance_km != null && (
                          <span className="pill">{b.distance_km.toFixed(1)} km</span>
                        )}
                        {b.last_updated && (
                          <span className="pill pill-soft">{b.last_updated}</span>
                        )}
                      </div>
                      <ContactButton number={b.contact_number} />
                      <div style={{ marginTop: "0.5rem" }}>
                        <Link className="button button-secondary button-full" to={`/blood-banks/${b.id}`}>
                          View full profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            )}

            {donors.length > 0 && (
              <CollapsibleCard icon={Users} title="Nearby donors" count={donors.length} defaultOpen>
                <div className="stacked-cards">
                  {donors.map((d) => (
                    <div className="info-card" key={d.anon_id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <h3 style={{ margin: 0 }}>{d.anon_id}</h3>
                        <span className="pill">{d.blood_group}</span>
                        {d.verified ? (
                          <span className="pill pill-soft" title="Verified donor"><ShieldCheck size={13} /></span>
                        ) : null}
                      </div>
                      <div className="list-row">
                        <span className="meta-label">
                          <MapPin size={13} />
                          {[d.area, d.city].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                      <div className="inline-pills">
                        {d.distance_km != null && (
                          <span className="pill">{d.distance_km.toFixed(1)} km</span>
                        )}
                      </div>
                      <Link className="button button-primary button-full" to="/receiver/create-request" style={{ marginTop: "0.5rem" }}>
                        Send match request
                      </Link>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            )}

            {drives.length > 0 && (
              <CollapsibleCard icon={CalendarHeart} title="Donation drives" count={drives.length} defaultOpen>
                <div className="stacked-cards">
                  {drives.map((dr) => (
                    <div className="info-card" key={dr.id}>
                      <h3 style={{ margin: "0 0 0.25rem" }}>{dr.title}</h3>
                      <p className="meta-label" style={{ margin: "0 0 0.25rem" }}>{dr.blood_bank_name}</p>
                      <div className="list-row">
                        <span className="meta-label">
                          <MapPin size={13} />
                          {[dr.location_address, dr.city].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                      <div className="inline-pills">
                        {dr.event_date && (
                          <span className="pill pill-soft">
                            {new Date(dr.event_date).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        )}
                        {dr.start_time && dr.end_time && (
                          <span className="pill pill-soft">
                            {dr.start_time.slice(0, 5)} – {dr.end_time.slice(0, 5)}
                          </span>
                        )}
                        {dr.days_until != null && (
                          <span className="pill">
                            {dr.days_until === 0 ? "Today" : dr.days_until === 1 ? "Tomorrow" : `In ${dr.days_until} days`}
                          </span>
                        )}
                      </div>
                      {dr.target_blood_groups && (
                        <div className="inline-pills" style={{ marginTop: "0.35rem" }}>
                          {dr.target_blood_groups.split(",").map((bg) => (
                            <span className="pill pill-soft" key={bg.trim()}>{bg.trim()}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: "0.5rem" }}>
                        <Link className="button button-secondary button-full" to={`/drives/${dr.id}`}>
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
