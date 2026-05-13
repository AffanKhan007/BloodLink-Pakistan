import { ArrowRight, Clock3, Droplets, MapPin, Users } from "lucide-react";

import StatusBadge from "./StatusBadge";

export default function RequestCard({ request, actions, footer, onClick }) {
  const interactive = typeof onClick === "function";

  return (
    <article
      className={`request-card ${interactive ? "request-card-interactive" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="request-card-accent" />
      <div className="request-card-header">
        <div>
          <p className="eyebrow eyebrow-inline">
            <Droplets size={14} />
            {request.blood_group_needed} blood needed
          </p>
          <h3>{request.hospital_name}</h3>
          <p className="request-card-subtitle">{request.patient_name}</p>
        </div>
        <StatusBadge value={request.status} />
      </div>
      <div className="request-grid">
        <div>
          <span className="meta-label">Patient</span>
          <strong>{request.patient_name}</strong>
        </div>
        <div>
          <span className="meta-label">Units</span>
          <strong>{request.units_required}</strong>
        </div>
        <div>
          <span className="meta-label">Urgency</span>
          <strong>{request.urgency_level}</strong>
        </div>
        <div>
          <span className="meta-label">Location</span>
          <strong>
            {request.city}, {request.area}
          </strong>
        </div>
      </div>
      <div className="request-meta-row">
        <span>
          <MapPin size={14} />
          {request.ward_room || "Ward pending"}
        </span>
        <span>
          <Users size={14} />
          {request.confirmed_donor_count || 0} confirmed donors
        </span>
        {request.required_by ? (
          <span>
            <Clock3 size={14} />
            Required soon
          </span>
        ) : null}
      </div>
      {footer ? <p className="card-footer-copy">{footer}</p> : null}
      {actions ? (
        <div className="card-actions">
          {actions}
          {interactive ? (
            <span className="request-card-link-hint">
              Open
              <ArrowRight size={15} />
            </span>
          ) : null}
        </div>
      ) : interactive ? (
        <div className="card-actions">
          <span className="request-card-link-hint">
            View details
            <ArrowRight size={15} />
          </span>
        </div>
      ) : null}
    </article>
  );
}
