export function LoadingState({ label = "Loading" }) {
  return (
    <div className="state-card">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="state-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function AlertMessage({ type = "info", children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

