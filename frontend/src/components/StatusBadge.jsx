export default function StatusBadge({ value }) {
  const tone = String(value || "")
    .toLowerCase()
    .replace(/_/g, "-");
  return <span className={`status-badge status-${tone}`}>{String(value || "").replace(/_/g, " ")}</span>;
}

