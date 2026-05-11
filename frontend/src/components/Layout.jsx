import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const navByRole = {
  donor: [
    { label: "Dashboard", to: "/donor" },
    { label: "My Profile", to: "/donor/profile" },
    { label: "Matching Requests", to: "/donor/requests" },
    { label: "My Matches", to: "/donor/matches" },
    { label: "Notifications", to: "/donor/notifications" },
  ],
  receiver: [
    { label: "Dashboard", to: "/receiver" },
    { label: "Create Request", to: "/receiver/create-request" },
    { label: "My Requests", to: "/receiver/requests" },
    { label: "Matched Donors", to: "/receiver/matched-donors" },
  ],
  admin: [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Donors", to: "/admin/donors" },
    { label: "Blood Requests", to: "/admin/requests" },
    { label: "Matches", to: "/admin/matches" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Audit Logs", to: "/admin/audit-logs" },
  ],
  super_admin: [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Donors", to: "/admin/donors" },
    { label: "Blood Requests", to: "/admin/requests" },
    { label: "Matches", to: "/admin/matches" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Audit Logs", to: "/admin/audit-logs" },
  ],
  operations_agent: [
    { label: "Dashboard", to: "/admin" },
    { label: "Blood Requests", to: "/admin/requests" },
    { label: "Reports", to: "/admin/reports" },
  ],
  hospital_admin: [
    { label: "Dashboard", to: "/hospital" },
    { label: "Requests", to: "/hospital/requests" },
  ],
  hospital_staff: [
    { label: "Dashboard", to: "/hospital" },
    { label: "Requests", to: "/hospital/requests" },
  ],
  blood_bank_admin: [
    { label: "Inventory", to: "/blood-bank/inventory" },
  ],
  blood_bank_staff: [
    { label: "Inventory", to: "/blood-bank/inventory" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = navByRole[user?.role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BL</div>
          <div>
            <strong>BloodLink</strong>
            <p>Pakistan MVP</p>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="muted-label">{user?.role}</p>
          <strong>{user?.full_name}</strong>
          <button
            className="button button-secondary button-full"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="page-area">
        <header className="page-header">
          <div>
            <p className="eyebrow">Verified blood coordination</p>
            <h1>BloodLink Pakistan</h1>
          </div>
          <div className="header-chip">Not a transfusion approval system</div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
