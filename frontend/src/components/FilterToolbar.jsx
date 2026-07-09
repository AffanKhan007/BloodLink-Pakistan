import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function FilterToolbar({ searchValue, onSearchChange, searchPlaceholder = "Search", summary, filters = [] }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panelOpen]);

  return (
    <div className="toolbar-card">
      <div className="toolbar-search">
        <Search size={14} />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      <div className="toolbar-filters" ref={panelRef}>
        {filters.length ? (
          <div className="toolbar-filters-group">
            <button
              className="toolbar-filters-btn"
              onClick={() => setPanelOpen((prev) => !prev)}
              aria-expanded={panelOpen}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </button>
            {panelOpen ? (
              <div className="toolbar-filter-panel">
                {filters.map((filter) => (
                  <label key={filter.label} className="toolbar-select">
                    <span>{filter.label}</span>
                    <select value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {summary ? <div className="toolbar-summary">{summary}</div> : null}
    </div>
  );
}
