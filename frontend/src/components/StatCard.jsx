export default function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {helper ? <span>{helper}</span> : null}
    </div>
  );
}

