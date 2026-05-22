import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";

export default function ReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    const data = await apiRequest("/admin/reports", { token });
    setReports(data);
  };

  useEffect(() => {
    loadReports().finally(() => setLoading(false));
  }, [token]);

  const updateStatus = async (reportId, status) => {
    await apiRequest(`/admin/reports/${reportId}/status`, { method: "PATCH", token, body: { status } });
    await loadReports();
  };

  if (loading) return <LoadingState label="Loading reports" />;
  if (reports.length === 0) return <EmptyState title="No reports submitted" description="Receiver-submitted reports will appear here." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Moderation queue"
          title="Reports and suspicious activity"
          description="Keep user safety decisions visible and consistent by marking each report with a clear resolution state."
        />
      </section>
      <div className="stacked-cards">
        {reports.map((report) => (
          <div className="info-card" key={report.id}>
            <div className="list-row">
              <div>
                <strong>Report #{report.id}</strong>
                <p>{report.reason}</p>
              </div>
              <StatusBadge value={report.status} />
            </div>
            <div className="card-actions">
              {["reviewed", "resolved", "dismissed"].map((status) => (
                <button key={status} className="button button-secondary" onClick={() => updateStatus(report.id, status)}>
                  Mark {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
