import { MessageSquare, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { WS_BASE_URL, apiRequest } from "../api/client";
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

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setError("");
    try {
      const activeSocket = socketRef.current;
      if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        activeSocket.send(JSON.stringify({ message: message.trim() }));
      } else {
        await apiRequest(`/chats/${selectedChatId}/messages`, {
          method: "POST",
          token,
          body: { message: message.trim() },
        });
        await loadChats();
        const detail = await apiRequest(`/chats/${selectedChatId}`, { token });
        setChatDetail(detail);
      }
      setMessage("");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

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
                    <h2>{chatDetail.counterpart.full_name}</h2>
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
    </div>
  );
}
