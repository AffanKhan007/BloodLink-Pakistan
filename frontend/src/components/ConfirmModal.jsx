export default function ConfirmModal({ open, title, description, confirmLabel, onCancel, onConfirm, tone = "danger" }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="button button-secondary" onClick={onCancel}>
            Keep current
          </button>
          <button className={`button ${tone === "danger" ? "button-danger" : "button-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

