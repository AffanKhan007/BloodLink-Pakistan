import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading", description = "Preparing the latest data for this workspace." }) {
  return (
    <div className="state-card">
      <div className="state-illustration state-illustration-loading">
        <LoaderCircle size={28} className="spin-icon" />
      </div>
      <h3>{label}</h3>
      <p>{description}</p>
      <div className="state-skeleton">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action = null }) {
  return (
    <div className="state-card">
      <div className="state-illustration">
        <Inbox size={28} />
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
      <CircleAlert size={16} />
      <span>{children}</span>
    </div>
  );
}
