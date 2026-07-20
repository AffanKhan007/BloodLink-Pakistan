import { ArrowRight, Clock3, Droplets, MapPin, Users, Flag } from "lucide-react";
import { useState } from "react";

import StatusBadge from "./StatusBadge";
import ReportModal from "./ReportModal";
import { useAuth } from "../auth/AuthContext";

export default function RequestCard({ request, actions, footer, onClick, selected }) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const interactive = typeof onClick === "function";
  const isUrgent =
    String(request?.urgency_level || "").toLowerCase() === "critical" ||
    String(request?.urgency_level || "").toLowerCase() === "urgent";

  const isCreator = user?.id === request.created_by_user_id;
  const isAdmin = ["admin", "super_admin", "operations_agent"].includes(user?.role);
  const showReport = user && !isCreator && !isAdmin;

  return (
    <article
      className={`request-card ${interactive ? "request-card-interactive" : ""} ${isUrgent ? "request-card-urgent" : ""} ${selected ? "request-card-selected" : ""}`}
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
            <Droplets size={12} />
            {request.blood_group_needed} blood needed
          </p>
          <h3>{request.hospital_name}</h3>
          <p className="request-card-subtitle">{request.patient_name}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <StatusBadge value={request.status} />
          {showReport && (
            <button
              type="button"
              className="report-card-btn report-hover"
              title="Report this request"
              onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}
            >
              <Flag size={13} />
            </button>
          )}
        </div>
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
        {request.requester_total_requests > 0 ? (
          <div>
            <span className="meta-label">Requester history</span>
            <strong>
              {request.requester_fulfilled_count}/{request.requester_total_requests} fulfilled
            </strong>
          </div>
        ) : null}
      </div>
      <div className="request-meta-row">
        <span>
          <MapPin size={12} />
          {request.ward_room || "Ward pending"}
        </span>
        <span>
          <Users size={12} />
          {request.confirmed_donor_count || 0} confirmed donors
        </span>
        {request.required_by ? (
          <span>
            <Clock3 size={12} />
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
              <ArrowRight size={13} />
            </span>
          ) : null}
        </div>
      ) : interactive ? (
        <div className="card-actions">
          <span className="request-card-link-hint">
            View details
            <ArrowRight size={13} />
          </span>
        </div>
      ) : null}
      {reportOpen && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedType="request"
          reportedId={request.id}
          title="Report blood request"
        />
      )}
    </article>
  );
}
