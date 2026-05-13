export default function StatCard({ label, value, helper, icon: Icon, tone = "default" }) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-top">
        <p>{label}</p>
        {Icon ? (
          <div className="stat-card-icon">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <h3>{value}</h3>
      {helper ? <span>{helper}</span> : null}
    </div>
  );
}
