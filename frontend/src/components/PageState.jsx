import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="state-card">
      <div className="state-illustration state-illustration-loading">
        <LoaderCircle size={28} className="spin-icon" />
      </div>
      <h3>{label}</h3>
      <div className="state-skeleton">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="state-card">
      <div className="state-illustration">
        <Inbox size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
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
