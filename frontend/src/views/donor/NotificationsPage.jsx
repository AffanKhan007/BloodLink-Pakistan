import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, LoadingState } from "../../components/PageState";
import SectionIntro from "../../components/SectionIntro";
import { formatDate } from "../../utils/format";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    const data = await apiRequest("/notifications", { token });
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifications().finally(() => setLoading(false));
  }, [token]);

  const markRead = async (id) => {
    await apiRequest(`/notifications/${id}/read`, { method: "PATCH", token });
    await loadNotifications();
  };

  if (loading) return <LoadingState label="Loading notifications" />;
  if (notifications.length === 0) return <EmptyState title="No notifications yet" description="Updates about matches and requests will appear here." />;

  return (
    <div className="page-stack">
      <section className="content-card">
        <SectionIntro
          eyebrow="Updates"
          title="Notifications"
          description="Recent match and request updates."
        />
      </section>
      {notifications.map((notification) => (
        <div className="content-card" key={notification.id}>
          <div className="list-row">
            <div>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
            {!notification.is_read ? (
              <button className="button button-secondary" onClick={() => markRead(notification.id)}>
                Mark read
              </button>
            ) : null}
          </div>
          <span className="muted-label">{formatDate(notification.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
