import StatusBadge from "./StatusBadge";

export default function RequestCard({ request, actions, footer, onClick }) {
  return (
    <article className="request-card" onClick={onClick}>
      <div className="request-card-header">
        <div>
          <p className="eyebrow">{request.blood_group_needed} blood needed</p>
          <h3>{request.hospital_name}</h3>
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
      {footer ? <p className="card-footer-copy">{footer}</p> : null}
      {actions ? <div className="card-actions">{actions}</div> : null}
    </article>
  );
}

