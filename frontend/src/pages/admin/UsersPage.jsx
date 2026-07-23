import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { EmptyState, LoadingState } from "../../components/PageState";
import StatusBadge from "../../components/StatusBadge";

export default function UsersPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadUsers = async () => {
    const data = await apiRequest("/admin/users", { token });
    setUsers(data.items || data);
  };

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, [token]);

  const blockUser = async () => {
    await apiRequest(`/admin/users/${selectedUser.id}/block`, { method: "PATCH", token });
    setSelectedUser(null);
    await loadUsers();
  };

  if (loading) return <LoadingState label="Loading users" />;
  if (users.length === 0) return <EmptyState title="No users found" description="Registered accounts will appear here." />;

  return (
    <div className="stacked-cards">
      {users.map((user) => (
        <div
          className={`info-card${selectedUserId === user.id ? " info-card-selected" : ""}`}
          key={user.id}
          onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedUserId(selectedUserId === user.id ? null : user.id);
            }
          }}
        >
          <div className="list-row">
            <div>
              <strong>{user.full_name}</strong>
              <p>{user.email}</p>
            </div>
            <StatusBadge value={user.is_active ? user.role : "blocked"} />
          </div>
          {user.is_active ? (
            <button className="button button-secondary" onClick={() => setSelectedUser(user)}>
              Block user
            </button>
          ) : null}
        </div>
      ))}

      <ConfirmModal
        open={Boolean(selectedUser)}
        title="Block this user?"
        description="This will disable future logins until an admin manually reactivates the account in code or database."
        confirmLabel="Block user"
        onCancel={() => setSelectedUser(null)}
        onConfirm={blockUser}
      />
    </div>
  );
}

