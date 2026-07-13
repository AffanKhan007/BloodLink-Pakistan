import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import citiesList from "../data/pakistan_cities.json";

export default function CityCombobox({ value, onChange, required = false }) {
  const dropdownRef = useRef(null);
  const [citySearch, setCitySearch] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [otherCity, setOtherCity] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredCities = citiesList.filter((city) => city !== "Other" && city.toLowerCase().includes(citySearch.toLowerCase()));

  useEffect(() => {
    if (!value) {
      setCitySearch("");
      setOtherCity("");
      setIsOther(false);
      return;
    }
    if (citiesList.includes(value)) {
      setCitySearch(value);
      setOtherCity("");
      setIsOther(false);
    } else {
      setCitySearch("");
      setOtherCity(value);
      setIsOther(true);
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectCity = (city) => {
    onChange(city);
    setCitySearch(city);
    setOtherCity("");
    setIsOther(false);
    setDropdownOpen(false);
  };

  const selectOther = () => {
    const typed = citySearch.trim();
    onChange(typed);
    setOtherCity(typed);
    setCitySearch("");
    setIsOther(true);
    setDropdownOpen(false);
  };

  if (isOther) {
    return (
      <div className="city-combo" ref={dropdownRef}>
        <div className="city-combo-input-wrap">
          <input
            className="city-combo-input"
            type="text"
            value={otherCity}
            onChange={(event) => {
              setOtherCity(event.target.value);
              onChange(event.target.value);
            }}
            placeholder="Enter your city name"
            required={required}
          />
          <button
            type="button"
            className="city-combo-clear"
            onClick={() => {
              setIsOther(false);
              setOtherCity("");
              setCitySearch(value && citiesList.includes(value) ? value : "");
              onChange("");
            }}
          >
            <X size={13} />
          </button>
        </div>
        <p className="city-other-hint">Custom city. Click x to pick from the list instead.</p>
      </div>
    );
  }

  return (
    <div className="city-combo" ref={dropdownRef}>
      <div className="city-combo-input-wrap">
        <input
          className="city-combo-input"
          type="text"
          value={citySearch}
          onChange={(event) => {
            setCitySearch(event.target.value);
            setDropdownOpen(true);
            if (event.target.value !== value) {
              onChange("");
            }
          }}
          onFocus={() => setDropdownOpen(true)}
          placeholder="Search city..."
          required={required}
        />
        <ChevronDown size={14} className={`city-combo-chevron ${dropdownOpen ? "open" : ""}`} />
      </div>
      {dropdownOpen ? (
        <ul className="city-combo-dropdown">
          {filteredCities.length === 0 ? (
            <li className="city-combo-empty">No matching city</li>
          ) : (
            filteredCities.map((city) => (
              <li key={city} className={`city-combo-option ${value === city ? "active" : ""}`} onClick={() => selectCity(city)}>
                {city}
              </li>
            ))
          )}
          <li className="city-combo-option city-combo-other" onClick={selectOther}>
            + Can't find your city? Enter it manually
          </li>
        </ul>
      ) : null}
    </div>
  );
}
