import { Download, ExternalLink, FileText, MessageSquare, SendHorizontal, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { API_BASE_URL, WS_BASE_URL, apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AlertMessage, EmptyState, LoadingState } from "./PageState";
import SectionIntro from "./SectionIntro";


export default function ChatWorkspace({ eyebrow, title, description }) {
  const { token, user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(location.state?.chatId || null);
  const [chatDetail, setChatDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docContentType, setDocContentType] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const socketRef = useRef(null);

  const loadChats = async () => {
    const data = await apiRequest("/chats", { token });
    setChats(data);
    if (!selectedChatId && data[0]) {
      setSelectedChatId(data[0].id);
    }
  };

  useEffect(() => {
    loadChats()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedChatId) {
      setChatDetail(null);
      return;
    }
    apiRequest(`/chats/${selectedChatId}`, { token })
      .then(setChatDetail)
      .catch((loadError) => setError(loadError.message));
    setShowRequestModal(false);
    setRequestData(null);
  }, [selectedChatId, token]);

  useEffect(() => {
    if (!selectedChatId || !token) {
      setSocketStatus("offline");
      return undefined;
    }

    const socket = new WebSocket(`${WS_BASE_URL}/chats/ws/${selectedChatId}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;
    setSocketStatus("connecting");

    socket.onopen = () => {
      setSocketStatus("live");
    };

    socket.onmessage = async (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "chat.connected") {
        setSocketStatus("live");
        return;
      }
      if (payload.type === "chat.error") {
        setError(payload.detail || "Chat connection error");
        return;
      }
      if (payload.type !== "chat.message") {
        return;
      }

      setChatDetail((current) => {
        if (!current || current.id !== payload.chat_id) {
          return current;
        }
        const exists = current.messages.some((item) => item.id === payload.message.id);
        if (exists) return current;
        return {
          ...current,
          subject: payload.subject ?? current.subject,
          messages: [...current.messages, payload.message],
        };
      });
      await loadChats();
    };

    socket.onerror = () => {
      setSocketStatus("error");
    };

    socket.onclose = () => {
      setSocketStatus("offline");
    };

    return () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      socket.close();
    };
  }, [selectedChatId, token]);

  const sendMessageText = async (text) => {
    if (!text.trim()) return;
    setError("");
    try {
      const activeSocket = socketRef.current;
      if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        activeSocket.send(JSON.stringify({ message: text.trim() }));
      } else {
        await apiRequest(`/chats/${selectedChatId}/messages`, {
          method: "POST",
          token,
          body: { message: text.trim() },
        });
        await loadChats();
        const detail = await apiRequest(`/chats/${selectedChatId}`, { token });
        setChatDetail(detail);
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    await sendMessageText(message);
    setMessage("");
  };

  const openRequestDetails = async () => {
    if (loadingRequest) return;
    if (requestData) {
      setShowRequestModal(true);
      return;
    }
    if (!chatDetail?.request_id) {
      setError("No blood request is linked to this conversation.");
      return;
    }
    setError("");
    setLoadingRequest(true);
    try {
      const data = await apiRequest(`/chats/${selectedChatId}/request`, { token });
      setRequestData(data);
      setShowRequestModal(true);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load request details. Please try again.");
    } finally {
      setLoadingRequest(false);
    }
  };

  const openDocument = async (doc) => {
    setDocLoading(true);
    setDocError("");
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/request-documents/${doc.id}`, {
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
      setDocFileName(doc.file_url);
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

  const suggestedMessage = chatDetail && chatDetail.messages.length === 0
    ? "Hello, I would like to ask whether your institution can help with this blood requirement."
    : "Any updates on this?";

  if (loading) return <LoadingState label="Loading chats" />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro eyebrow={eyebrow} title={title} description={description} />
        {error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      </section>

      {chats.length === 0 ? (
        <EmptyState title="No conversations yet" description="Start a conversation from a matched donor, public donor, blood bank, or institution listing." />
      ) : (
        <div className="chat-layout">
          <section className="content-card chat-list-panel">
            <div className="section-heading section-heading-compact">
              <div className="section-copy">
                <p className="eyebrow">Conversation list</p>
                <h2>Messages</h2>
              </div>
            </div>
            <div className="stacked-cards">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`chat-list-item ${selectedChatId === chat.id ? "chat-list-item-active" : ""}`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div>
                    <strong>{chat.counterpart.full_name}</strong>
                    <p>{chat.subject || "BloodLink conversation"}</p>
                  </div>
                  <span className="muted-label">{chat.counterpart.role.replace(/_/g, " ")}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="content-card chat-thread-panel">
            {!chatDetail ? (
              <EmptyState title="Select a conversation" description="Choose a conversation from the list to view the message thread." />
            ) : (
              <>
                <div className="section-heading section-heading-compact">
                  <div className="section-copy">
                    <p className="eyebrow">Conversation</p>
                    {user?.role === "institution_donor" ? (
                      <button type="button" className="chat-name-btn" onClick={openRequestDetails}>
                        <h2>{chatDetail.counterpart.full_name}</h2>
                        <ExternalLink size={13} />
                      </button>
                    ) : (
                      <h2>{chatDetail.counterpart.full_name}</h2>
                    )}
                    <p className="section-description">{chatDetail.subject || `Messages between ${user?.full_name} and ${chatDetail.counterpart.full_name}`}</p>
                  </div>
                  <span className={`chat-presence chat-presence-${socketStatus}`}>
                    {socketStatus === "live" ? "Live" : socketStatus === "connecting" ? "Connecting" : socketStatus === "error" ? "Connection issue" : "Offline"}
                  </span>
                </div>
                <div className="chat-messages">
                  {chatDetail.messages.map((item) => (
                    <div
                      key={item.id}
                      className={`chat-bubble ${item.sender_id === user?.id ? "chat-bubble-own" : "chat-bubble-other"}`}
                    >
                      <span>{item.message}</span>
                    </div>
                  ))}
                </div>
                {user?.role !== "institution_donor" && (
                  <div className="quick-replies">
                    <button
                      type="button"
                      className="quick-reply-chip"
                      onClick={() => sendMessageText(suggestedMessage)}
                    >
                      <Zap size={14} />
                      <span>{suggestedMessage}</span>
                    </button>
                  </div>
                )}
                <form className="chat-form" onSubmit={sendMessage}>
                  <label className="form-span">
                    Reply
                    <textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." />
                  </label>
                  <div className="form-actions-row">
                    <button className="button button-primary button-with-icon" type="submit">
                      Send reply
                      <SendHorizontal size={14} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
      {showRequestModal && requestData ? (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Blood Request Details</h3>
              <button type="button" className="modal-close" onClick={() => setShowRequestModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <h4 className="detail-heading">Patient & Request</h4>
                <div className="detail-field"><span className="detail-label">Patient name</span><span className="detail-value">{requestData.patient_name}</span></div>
                <div className="detail-field"><span className="detail-label">Blood group needed</span><span className="detail-value">{requestData.blood_group_needed}</span></div>
                <div className="detail-field"><span className="detail-label">Units required</span><span className="detail-value">{requestData.units_required}</span></div>
              </div>
              <div className="detail-group">
                <h4 className="detail-heading">Hospital Context</h4>
                <div className="detail-field"><span className="detail-label">Hospital name</span><span className="detail-value">{requestData.hospital_name}</span></div>
                <div className="detail-field"><span className="detail-label">City</span><span className="detail-value">{requestData.city}</span></div>
                <div className="detail-field"><span className="detail-label">Area</span><span className="detail-value">{requestData.area}</span></div>
                <div className="detail-field"><span className="detail-label">Ward / Room</span><span className="detail-value">{requestData.ward_room}</span></div>
                <div className="detail-field"><span className="detail-label">Urgency</span><span className="detail-value">{requestData.urgency_level}</span></div>
                <div className="detail-field"><span className="detail-label">Required by</span><span className="detail-value">{new Date(requestData.required_by).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span></div>
              </div>
              <div className="detail-group">
                <h4 className="detail-heading">Attendant & Verification</h4>
                <div className="detail-field"><span className="detail-label">Attendant name</span><span className="detail-value">{requestData.attendant_name}</span></div>
                <div className="detail-field"><span className="detail-label">Attendant phone</span><span className="detail-value">{requestData.attendant_phone}</span></div>
                {requestData.additional_notes ? (
                  <div className="detail-field detail-field-notes"><span className="detail-label">Additional notes</span><span className="detail-value">{requestData.additional_notes}</span></div>
                ) : null}
              </div>
              {requestData.documents?.length > 0 ? (
                <div className="detail-group">
                  <h4 className="detail-heading">Hospital Slip / Documents</h4>
                  <ul className="document-list">
                    {requestData.documents.map((doc) => (
                      <li key={doc.id}>
                        <button type="button" className="document-link" onClick={() => openDocument(doc)}>
                          <FileText size={14} />
                          {doc.document_type}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
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
                <p className="muted-label">Loading document...</p>
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
