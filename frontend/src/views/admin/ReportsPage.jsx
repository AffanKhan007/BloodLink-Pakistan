import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, Flag, MessageSquare, ExternalLink, X, AlertTriangle } from "lucide-react";

import { API_BASE_URL, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import StatusBadge from "../../components/StatusBadge";
import FilterToolbar from "../../components/FilterToolbar";

export default function ReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingReport, setUpdatingReport] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Evidence preview state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docContentType, setDocContentType] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  const loadReports = async () => {
    let query = "";
    const params = [];
    if (statusFilter && statusFilter !== "all") {
      params.push(`status=${statusFilter}`);
    }
    if (typeFilter && typeFilter !== "all") {
      params.push(`reported_type=${typeFilter}`);
    }
    if (params.length > 0) {
      query = "?" + params.join("&");
    }
    try {
      const data = await apiRequest(`/reports${query}`, { token });
      setReports(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadReports().finally(() => setLoading(false));
  }, [token, statusFilter, typeFilter]);

  const loadReportDetail = async (reportId) => {
    setDetailLoading(true);
    setSuccess("");
    setError("");
    try {
      const data = await apiRequest(`/reports/${reportId}`, { token });
      setReportDetail(data);
      setAdminNotes(data.admin_notes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReportClick = (reportId) => {
    if (selectedReportId === reportId) {
      setSelectedReportId(null);
      setReportDetail(null);
    } else {
      setSelectedReportId(reportId);
      loadReportDetail(reportId);
    }
  };

  const handleUpdateReport = async (newStatus) => {
    setUpdatingReport(true);
    setError("");
    setSuccess("");
    try {
      const updated = await apiRequest(`/reports/${selectedReportId}`, {
        method: "PATCH",
        token,
        body: {
          status: newStatus,
          admin_notes: adminNotes,
        },
      });
      setSuccess(`Report updated to status: ${newStatus.replace("_", " ")}`);
      setReportDetail(updated);
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingReport(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (
      !window.confirm(
        "Are you sure you want to reject/remove this blood request? This will notify the creator and cancel matches."
      )
    ) {
      return;
    }
    setRejectingRequest(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/admin/requests/${requestId}/reject`, {
        method: "PATCH",
        token,
      });
      setSuccess("Blood request successfully rejected and removed.");
      if (selectedReportId) {
        await loadReportDetail(selectedReportId);
      }
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setRejectingRequest(false);
    }
  };

  const openDocument = async (reportId, filename) => {
    setDocLoading(true);
    setDocError("");
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/report-evidence/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to load document (${response.status})`);
      }
      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || "";
      const url = URL.createObjectURL(blob);
      setDocPreviewUrl(url);
      setDocContentType(contentType);
      setDocFileName(filename);
      setShowDocModal(true);
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  const closeDocModal = () => {
    if (docPreviewUrl) {
      URL.revokeObjectURL(docPreviewUrl);
    }
    setShowDocModal(false);
    setDocPreviewUrl(null);
    setDocContentType("");
    setDocFileName("");
    setDocError("");
  };

  if (loading) return <LoadingState label="Loading reports" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro eyebrow="Moderation Desk" title="Review user reports" description="Investigate flagged items and update status." />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
        {success ? <AlertMessage type="success">{success}</AlertMessage> : null}
        
        <FilterToolbar
          searchPlaceholder="Filters only"
          summary={
            <span className="toolbar-result">
              <Flag size={13} />
              {reports.length} report{reports.length === 1 ? "" : "s"} found
            </span>
          }
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "reviewed", label: "Reviewed" },
                { value: "action_taken", label: "Action Taken" },
                { value: "dismissed", label: "Dismissed" },
              ],
            },
            {
              label: "Type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: "all", label: "All types" },
                { value: "request", label: "Request" },
                { value: "conversation", label: "Conversation" },
              ],
            },
          ]}
        />
      </section>

      {reports.length === 0 ? (
        <EmptyState title="No reports found" description="No reports match your current filters." />
      ) : (
        <div className="stacked-cards">
          {reports.map((report) => {
            const isPending = report.status === "pending";
            const isExpanded = selectedReportId === report.id;
            return (
              <div
                className={`info-card${isExpanded ? " info-card-selected" : ""}`}
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleReportClick(report.id);
                  }
                }}
                style={isPending ? { borderLeft: "3px solid var(--color-warning)" } : {}}
              >
                <div className="list-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong>Report #{report.id}</strong>
                      <span className="muted-label">&middot; By {report.reporter_name}</span>
                    </div>
                    <div style={{ marginTop: "0.25rem" }}>
                      <span className="muted-label" style={{ marginRight: "0.5rem" }}>
                        Target: {report.reported_type.replace(/_/g, " ")} ({report.entity_label})
                      </span>
                      {report.entity_admin_path && (
                        <Link
                          href={report.entity_admin_path}
                          className="text-link"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.85rem" }}
                        >
                          View Entity <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                    <p style={{ marginTop: "0.45rem", fontWeight: "bold" }}>
                      Reason: {report.reason.replace(/_/g, " ")}
                    </p>
                    {report.description && (
                      <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: "0.25rem 0 0 0" }}>
                        Preview: {report.description.length > 80 ? `${report.description.substring(0, 80)}...` : report.description}
                      </p>
                    )}
                    <span className="muted-label" style={{ display: "block", marginTop: "0.35rem", fontSize: "0.78rem" }}>
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <StatusBadge value={report.status} />
                </div>

                {isExpanded && (
                  <div
                    className="report-detail-expanded"
                    style={{
                      marginTop: "1.2rem",
                      paddingTop: "1.2rem",
                      borderTop: "1px solid var(--border)",
                      display: "grid",
                      gap: "1.2rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {detailLoading ? (
                      <LoadingState label="Loading report details..." />
                    ) : reportDetail ? (
                      <>
                        <div>
                          <h4 style={{ margin: "0 0 0.25rem 0" }}>Full Description</h4>
                          <p style={{ background: "var(--color-surface-alt)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.95rem" }}>
                            {reportDetail.description || "No text explanation provided."}
                          </p>
                        </div>

                        {reportDetail.evidence_file && (
                          <div>
                            <h4 style={{ margin: "0 0 0.5rem 0" }}>Evidence Attachment</h4>
                            <button
                              type="button"
                              className="button button-secondary button-with-icon"
                              onClick={() => openDocument(reportDetail.id, reportDetail.evidence_file)}
                            >
                              <FileText size={14} />
                              View evidence ({reportDetail.evidence_file})
                            </button>
                          </div>
                        )}

                        {/* Inline Chat Log Preview */}
                        {reportDetail.reported_type === "conversation" && reportDetail.reported_entity?.conversation && (
                          <div>
                            <h4 style={{ margin: "0 0 0.25rem 0" }}>Conversation Transcript</h4>
                            <p className="muted-label" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                              Subject: {reportDetail.reported_entity.conversation.subject || "No subject"}
                              <br />
                              Participants: {reportDetail.reported_entity.conversation.participant_one.full_name} ↔ {reportDetail.reported_entity.conversation.participant_two.full_name}
                            </p>
                            <div
                              style={{
                                maxHeight: "300px",
                                overflowY: "auto",
                                padding: "1rem",
                                background: "var(--color-surface-alt)",
                                borderRadius: "6px",
                                border: "1px solid var(--border)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                              }}
                            >
                              {reportDetail.reported_entity.conversation.messages.length === 0 ? (
                                <p className="muted-label">No messages sent in this conversation.</p>
                              ) : (
                                reportDetail.reported_entity.conversation.messages.map((msg) => {
                                  const isPartOne = msg.sender_id === reportDetail.reported_entity.conversation.participant_one.id;
                                  const senderName = isPartOne 
                                    ? reportDetail.reported_entity.conversation.participant_one.full_name 
                                    : reportDetail.reported_entity.conversation.participant_two.full_name;
                                  return (
                                    <div
                                      key={msg.id}
                                      style={{
                                        alignSelf: isPartOne ? "flex-start" : "flex-end",
                                        background: isPartOne ? "var(--color-paper)" : "rgba(142, 38, 50, 0.08)",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        maxWidth: "80%",
                                      }}
                                    >
                                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--color-warning)" }}>
                                        {senderName}
                                      </span>
                                      <p style={{ margin: "2px 0 0 0", fontSize: "0.88rem" }}>{msg.message}</p>
                                      <span style={{ fontSize: "0.68rem", color: "var(--muted)", float: "right", marginTop: "2px" }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Request Rejection Flow */}
                        {reportDetail.reported_type === "request" && (
                          <div
                            style={{
                              background: "rgba(180, 35, 47, 0.05)",
                              border: "1px solid rgba(180, 35, 47, 0.2)",
                              borderRadius: "6px",
                              padding: "1rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            <div>
                              <strong style={{ display: "block" }}>Moderation action on request</strong>
                              <span className="muted-label" style={{ fontSize: "0.85rem" }}>
                                If this request is fake or spam, you can reject/remove it immediately.
                              </span>
                            </div>
                            <button
                              type="button"
                              className="button button-secondary"
                              style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                              disabled={rejectingRequest}
                              onClick={() => handleRejectRequest(reportDetail.reported_id)}
                            >
                              {rejectingRequest ? "Processing..." : "Reject & Remove Request"}
                            </button>
                          </div>
                        )}

                        {/* Repeat Offender History */}
                        <div>
                          <h4 style={{ margin: "0 0 0.35rem 0" }}>Related reports on target</h4>
                          {reportDetail.related_reports && reportDetail.related_reports.length > 0 ? (
                            <div style={{ display: "grid", gap: "0.5rem" }}>
                              {reportDetail.related_reports.map((rel) => (
                                <div
                                  key={rel.id}
                                  style={{
                                    fontSize: "0.88rem",
                                    padding: "0.6rem",
                                    background: "var(--color-surface-alt)",
                                    borderRadius: "4px",
                                    borderLeft: "2px solid var(--color-muted)",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <strong>Report #{rel.id} (By {rel.reporter_name})</strong>
                                    <span style={{ fontSize: "0.78rem" }}>{rel.status}</span>
                                  </div>
                                  <p style={{ margin: "2px 0", fontWeight: "bold" }}>
                                    Reason: {rel.reason.replace(/_/g, " ")}
                                  </p>
                                  {rel.description && <p style={{ margin: "2px 0 0 0", fontStyle: "italic" }}>"{rel.description}"</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="muted-label" style={{ fontSize: "0.88rem", margin: 0 }}>
                              No other reports filed against this reported entity.
                            </p>
                          )}
                        </div>

                        {/* Update Review Status & Notes */}
                        <div
                          style={{
                            borderTop: "1px dashed var(--border)",
                            paddingTop: "1rem",
                            display: "grid",
                            gap: "0.85rem",
                          }}
                        >
                          <label>
                            <strong>Internal Admin Notes</strong> (Hidden from reporter)
                            <textarea
                              rows="3"
                              placeholder="Describe your review notes, outcome observations, or resolution reasoning..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </label>

                          <div className="card-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="button button-primary"
                              disabled={updatingReport}
                              onClick={() => handleUpdateReport("reviewed")}
                            >
                              Mark Reviewed
                            </button>
                            <button
                              type="button"
                              className="button button-success"
                              disabled={updatingReport}
                              onClick={() => handleUpdateReport("action_taken")}
                            >
                              Mark Action Taken
                            </button>
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={updatingReport}
                              onClick={() => handleUpdateReport("dismissed")}
                            >
                              Dismiss Report
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <EmptyState title="Unable to load details" description="Failed to retrieve report data." />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showDocModal ? (
        <div className="modal-overlay" onClick={closeDocModal}>
          <div className="modal-content document-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{docFileName}</h3>
              <div className="modal-header-actions">
                {docPreviewUrl ? (
                  <a className="button button-primary button-with-icon" href={docPreviewUrl} download={docFileName} onClick={(e) => e.stopPropagation()}>
                    <Download size={14} /> Download
                  </a>
                ) : null}
                <button type="button" className="modal-close" onClick={closeDocModal}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body document-preview-body">
              {docLoading ? (
                <p className="muted-label">Loading evidence document...</p>
              ) : docError ? (
                <p className="error-text">{docError}</p>
              ) : docContentType.startsWith("image/") ? (
                <img src={docPreviewUrl} alt={docFileName} className="document-preview-img" />
              ) : docContentType === "application/pdf" ? (
                <iframe src={docPreviewUrl} title={docFileName} className="document-preview-pdf" />
              ) : (
                <div className="document-preview-fallback">
                  <p className="muted-label">Preview not available for this file type.</p>
                  {docPreviewUrl ? (
                    <a className="button button-primary" href={docPreviewUrl} download={docFileName}>Download file</a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
