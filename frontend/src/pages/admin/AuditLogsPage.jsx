import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import { formatDate } from "../../utils/format";

export default function AuditLogsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    apiRequest("/admin/audit-logs", { token })
      .then((data) => setLogs(data.items || data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading audit logs" />;
  if (logs.length === 0) return <EmptyState title="No audit logs yet" description="Admin actions will be recorded here." />;

  return (
    <div className="stacked-cards">
      {logs.map((log) => (
        <div className="info-card" key={log.id}>
          <strong>{log.action}</strong>
          <p>
            {log.entity_type} #{log.entity_id}
          </p>
          <p>{JSON.stringify(log.details)}</p>
          <span className="muted-label">{formatDate(log.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

