import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";

export default function BloodUnitDetailPage() {
  const { token } = useAuth();
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [trace, setTrace] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const [unitData, traceData] = await Promise.all([
      apiRequest(`/api/v1/blood-units/${unitId}`, { token }),
      apiRequest(`/api/v1/blood-units/${unitId}/trace`, { token }),
    ]);
    setUnit(unitData);
    setTrace(traceData);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, [token, unitId]);

  const updateStatus = async (status) => {
    setError("");
    try {
      await apiRequest(`/api/v1/blood-units/${unitId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await load();
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  if (error && !unit) return <AlertMessage type="error">{error}</AlertMessage>;
  if (!unit) return <LoadingState label="Loading blood unit details" />;

  return (
    <div className="page-stack">
      {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      <section className="content-card">
        <div className="list-row">
          <div>
            <p className="eyebrow">Blood unit</p>
            <h2>{unit.unit_code}</h2>
          </div>
          <StatusBadge value={unit.status} />
        </div>
        <div className="request-grid">
          <div>
            <span className="meta-label">Blood group</span>
            <strong>{unit.blood_group}</strong>
          </div>
          <div>
            <span className="meta-label">Component</span>
            <strong>{unit.component_type}</strong>
          </div>
          <div>
            <span className="meta-label">Units available</span>
            <strong>{unit.units_available}</strong>
          </div>
          <div>
            <span className="meta-label">Testing</span>
            <strong>{unit.testing_status}</strong>
          </div>
          <div>
            <span className="meta-label">Expires</span>
            <strong>{formatDate(unit.expires_at)}</strong>
          </div>
        </div>
        <div className="card-actions">
          {["available", "reserved", "issued", "expired", "discarded"].map((status) => (
            <button key={status} className="button button-secondary" onClick={() => updateStatus(status)}>
              Mark {status}
            </button>
          ))}
        </div>
      </section>
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Traceability</p>
            <h2>Movement history</h2>
          </div>
        </div>
        {trace.length === 0 ? (
          <EmptyState title="No movements yet" description="Issue or transfer actions will appear here." />
        ) : (
          <div className="stacked-cards">
            {trace.map((item) => (
              <div className="info-card" key={item.id}>
                <strong>{item.movement_type}</strong>
                <p>{formatDate(item.movement_time)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
