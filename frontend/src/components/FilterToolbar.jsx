import { Search, SlidersHorizontal } from "lucide-react";

export default function FilterToolbar({ searchValue, onSearchChange, searchPlaceholder = "Search", summary, filters = [] }) {
  return (
    <div className="toolbar-card">
      <div className="toolbar-search">
        <Search size={16} />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      <div className="toolbar-filters">
        {filters.length ? (
          <>
            <span className="toolbar-icon-label">
              <SlidersHorizontal size={16} />
              Filters
            </span>
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
          </>
        ) : null}
      </div>
      {summary ? <div className="toolbar-summary">{summary}</div> : null}
    </div>
  );
}
