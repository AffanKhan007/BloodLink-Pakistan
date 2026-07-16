import { ChevronDown, Droplets, HeartPulse, MapPin, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import citiesList from "../../data/pakistan_cities.json";

const initialForm = {
  blood_group: "A+",
  city: "",
  area: "",
  age: 18,
  gender: "",
  last_donation_date: "",
  availability_status: "available",
  is_publicly_available: false,
  health_notes: "",
};

export default function DonorProfilePage() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [otherCity, setOtherCity] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredCities = citiesList.filter((c) => c !== "Other" && c.toLowerCase().includes(citySearch.toLowerCase()));

  useEffect(() => {
    apiRequest("/donors/profile/me", { token }).catch(() => null)
      .then((profile) => {
        if (profile) {
          const inList = citiesList.includes(profile.city);
          setForm({
            ...profile,
            last_donation_date: profile.last_donation_date || "",
            health_notes: profile.health_notes || "",
          });
          if (inList && profile.city) {
            setCitySearch(profile.city);
          } else if (profile.city) {
            setIsOther(true);
            setOtherCity(profile.city);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectCity = (city) => {
    setForm((current) => ({ ...current, city }));
    setIsOther(false);
    setOtherCity("");
    setCitySearch(city);
    setDropdownOpen(false);
  };

  const selectOther = () => {
    const typed = citySearch.trim();
    setIsOther(true);
    setOtherCity(typed);
    setForm((current) => ({ ...current, city: typed }));
    setDropdownOpen(false);
    setCitySearch("");
  };

  const handleOtherChange = (value) => {
    setOtherCity(value);
    setForm((current) => ({ ...current, city: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isOther && !otherCity.trim()) {
      setError("Please enter your city name.");
      return;
    }
    setError("");
    setMessage("");
    try {
      const cityValue = isOther ? otherCity.trim() : form.city;
      await apiRequest("/donors/profile", {
        method: "POST",
        token,
        body: { ...form, city: cityValue, last_donation_date: form.last_donation_date || null },
      });
      setMessage("Profile saved successfully.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (loading) return <LoadingState label="Loading donor profile" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Profile"
          title="My profile"
          description="Keep donation details current."
        />
        <div className="metrics-strip">
          <div className="metric-chip">
            <MapPin size={14} />
            <div>
              <span>Coverage area</span>
              <strong>{form.city || "Add city"} {form.area ? `/ ${form.area}` : ""}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <Droplets size={14} />
            <div>
              <span>Blood group</span>
              <strong>{form.blood_group}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <ShieldCheck size={14} />
            <div>
              <span>Availability</span>
              <strong>{form.availability_status}</strong>
            </div>
          </div>
          <div className="metric-chip">
            <HeartPulse size={14} />
            <div>
              <span>Health note</span>
              <strong>{form.health_notes ? "Added" : "Optional"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card">
        {message ? <AlertMessage type="success">{message}</AlertMessage> : null}
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        <form className="grid-form" onSubmit={handleSubmit}>
        <div className="form-section form-span">
          <div className="form-section-header">
            <h3>Donation profile</h3>
            <p>Core donation and location details.</p>
          </div>
        </div>
        <label className="field-required">
          Blood group
          <select value={form.blood_group} onChange={(event) => setForm((current) => ({ ...current, blood_group: event.target.value }))}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label className="field-required city-combo-wrap">
          City
          <div className="city-combo" ref={dropdownRef}>
            {isOther ? (
              <>
                <div className="city-combo-input-wrap">
                  <input
                    className="city-combo-input"
                    type="text"
                    value={otherCity}
                    onChange={(e) => handleOtherChange(e.target.value)}
                    placeholder="Enter your city name"
                    required
                  />
                  <button type="button" className="city-combo-clear" onClick={() => { setIsOther(false); setOtherCity(""); setCitySearch(form.city || ""); }}>
                    <X size={13} />
                  </button>
                </div>
                <p className="city-other-hint">Custom city — click × to pick from the list instead.</p>
              </>
            ) : (
              <>
                <div className="city-combo-input-wrap">
                  <input
                    className="city-combo-input"
                    type="text"
                    value={citySearch}
                    onChange={(e) => { setCitySearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Search city..."
                    required
                  />
                  <ChevronDown size={14} className={`city-combo-chevron ${dropdownOpen ? "open" : ""}`} />
                </div>
                {dropdownOpen && (
                  <ul className="city-combo-dropdown">
                    {filteredCities.length === 0 ? (
                      <li className="city-combo-empty">No matching city</li>
                    ) : (
                      filteredCities.map((city) => (
                        <li key={city} className={`city-combo-option ${form.city === city ? "active" : ""}`} onClick={() => selectCity(city)}>
                          {city}
                        </li>
                      ))
                    )}
                    <li className="city-combo-option city-combo-other" onClick={selectOther}>+ Can't find your city? Enter it manually</li>
                  </ul>
                )}
              </>
            )}
          </div>
        </label>
        <label className="field-required">
          Area
          <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
        </label>
        <label className="field-required">
          Age
          <input type="number" min="18" max="65" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) }))} required />
        </label>
        <label className="field-required">
          Gender
          <input value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} required />
        </label>
        <label>
          Last donation date
          <input
            type="date"
            value={form.last_donation_date}
            onChange={(event) => setForm((current) => ({ ...current, last_donation_date: event.target.value }))}
          />
        </label>
        <div className="form-section form-span">
          <div className="form-section-header">
            <h3>Availability and visibility</h3>
            <p>Control match and public visibility.</p>
          </div>
        </div>
        <label>
          Availability
          <select
            value={form.availability_status}
            onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.value }))}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label className="form-span">
          Public donor visibility
          <select
            value={form.is_publicly_available ? "yes" : "no"}
            onChange={(event) => setForm((current) => ({ ...current, is_publicly_available: event.target.value === "yes" }))}
          >
            <option value="no">Keep profile private to matched flows</option>
            <option value="yes">Show me to compatible receivers in my city</option>
          </select>
        </label>
        <div className="form-section form-span">
          <div className="form-section-header">
            <h3>Health context</h3>
            <p>Optional readiness notes.</p>
          </div>
        </div>
        <label className="form-span">
          Health notes
          <textarea
            rows="4"
            value={form.health_notes}
            onChange={(event) => setForm((current) => ({ ...current, health_notes: event.target.value }))}
            placeholder="Optional notes about donation timing, temporary restrictions, or health context."
          />
        </label>
          <div className="form-span form-actions-row">
            <button className="button button-primary">Save profile</button>
          </div>
        </form>
      </section>
    </div>
  );
}
