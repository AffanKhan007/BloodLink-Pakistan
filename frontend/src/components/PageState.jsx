import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading", description = "Loading your data..." }) {
  return (
    <div className="state-card no-theme-transition">
      <div className="state-illustration state-illustration-loading">
        <LoaderCircle size={22} className="spin-icon" />
      </div>
      <h3>{label}</h3>
      <p>{description}</p>
      <div className="state-skeleton no-theme-transition">
        <div className="skeleton-line skeleton-line-title" />
        <div className="skeleton-line skeleton-line-body" />
        <div className="skeleton-line skeleton-line-body short" />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action = null, icon: Icon = Inbox }) {
  return (
    <div className="state-card">
      <div className="state-illustration">
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-actions">{action}</div> : null}
    </div>
  );
}

export function AlertMessage({ type = "info", children }) {
  return (
    <div className={`alert alert-${type}`}>
      <CircleAlert size={14} />
      <span>{children}</span>
    </div>
  );
}
