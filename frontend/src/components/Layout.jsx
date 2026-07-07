import {
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileClock,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Syringe,
  University,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PageTransition from "./PageTransition";

const navByRole = {
  user: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", to: "/donor/profile", icon: Users },
    { label: "Create Request", to: "/receiver/create-request", icon: Droplets },
    { label: "My Requests", to: "/receiver/requests", icon: ClipboardList },
    { label: "Matching Requests", to: "/donor/requests", icon: Search },
    { label: "My Matches", to: "/donor/matches", icon: HeartHandshake },
    { label: "Available Donors", to: "/receiver/available-donors", icon: Search },
    { label: "Blood Banks", to: "/receiver/blood-banks", icon: Warehouse },
    { label: "Institutions", to: "/receiver/institutions", icon: University },
    { label: "Notifications", to: "/donor/notifications", icon: Bell },
    { label: "Chats", to: "/donor/chats", icon: MessageSquare },
  ],
  donor: [
    { label: "Dashboard", to: "/donor", icon: LayoutDashboard },
    { label: "My Profile", to: "/donor/profile", icon: Users },
    { label: "Matching Requests", to: "/donor/requests", icon: Search },
    { label: "My Matches", to: "/donor/matches", icon: HeartHandshake },
    { label: "Notifications", to: "/donor/notifications", icon: Bell },
    { label: "Chats", to: "/donor/chats", icon: MessageSquare },
  ],
  receiver: [
    { label: "Dashboard", to: "/receiver", icon: LayoutDashboard },
    { label: "Create Request", to: "/receiver/create-request", icon: Droplets },
    { label: "My Requests", to: "/receiver/requests", icon: ClipboardList },
    { label: "Matched Donors", to: "/receiver/matched-donors", icon: HeartHandshake },
    { label: "Available Donors", to: "/receiver/available-donors", icon: Search },
    { label: "Blood Banks", to: "/receiver/blood-banks", icon: Warehouse },
    { label: "Institutions", to: "/receiver/institutions", icon: University },
    { label: "Chats", to: "/receiver/chats", icon: MessageSquare },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Donors", to: "/admin/donors", icon: Syringe },
    { label: "Institutions", to: "/admin/institutions", icon: Building2 },
    { label: "Blood Requests", to: "/admin/requests", icon: Droplets },
    { label: "Matches", to: "/admin/matches", icon: HeartHandshake },
    { label: "Reports", to: "/admin/reports", icon: ClipboardCheck },
    { label: "Audit Logs", to: "/admin/audit-logs", icon: FileClock },
  ],
  super_admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Donors", to: "/admin/donors", icon: Syringe },
    { label: "Institutions", to: "/admin/institutions", icon: Building2 },
    { label: "Blood Requests", to: "/admin/requests", icon: Droplets },
    { label: "Matches", to: "/admin/matches", icon: HeartHandshake },
    { label: "Reports", to: "/admin/reports", icon: ClipboardCheck },
    { label: "Audit Logs", to: "/admin/audit-logs", icon: FileClock },
  ],
  operations_agent: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Blood Requests", to: "/admin/requests", icon: Droplets },
    { label: "Reports", to: "/admin/reports", icon: ClipboardCheck },
  ],
  hospital_admin: [
    { label: "Dashboard", to: "/hospital", icon: LayoutDashboard },
    { label: "Create Request", to: "/hospital/create-request", icon: Droplets },
    { label: "Requests", to: "/hospital/requests", icon: ClipboardList },
  ],
  hospital_staff: [
    { label: "Dashboard", to: "/hospital", icon: LayoutDashboard },
    { label: "Create Request", to: "/hospital/create-request", icon: Droplets },
    { label: "Requests", to: "/hospital/requests", icon: ClipboardList },
  ],
  blood_bank_admin: [
    { label: "Dashboard", to: "/blood-bank", icon: LayoutDashboard },
    { label: "Inventory", to: "/blood-bank/inventory", icon: Warehouse },
    { label: "Create Unit", to: "/blood-bank/create-unit", icon: Droplets },
    { label: "City Requests", to: "/blood-bank/city-requests", icon: ClipboardList },
  ],
  blood_bank_staff: [
    { label: "Dashboard", to: "/blood-bank", icon: LayoutDashboard },
    { label: "Inventory", to: "/blood-bank/inventory", icon: Warehouse },
    { label: "Create Unit", to: "/blood-bank/create-unit", icon: Droplets },
    { label: "City Requests", to: "/blood-bank/city-requests", icon: ClipboardList },
  ],
  institution_donor: [
    { label: "Dashboard", to: "/institution", icon: LayoutDashboard },
    { label: "Profile", to: "/institution/profile", icon: Building2 },
    { label: "Messages", to: "/institution/messages", icon: MessageSquare },
  ],
};

const institutionNavByStatus = {
  pending_approval: [{ label: "Verification Status", to: "/institution/verification-pending", icon: ShieldCheck }],
  rejected: [{ label: "Verification Review", to: "/institution/rejected", icon: ShieldCheck }],
  suspended: [{ label: "Account Status", to: "/institution/suspended", icon: ShieldCheck }],
};

const roleMeta = {
  user: {
    eyebrow: "Your workspace",
    title: "Donate and request, from one account",
    description: "Set up a donor profile, create blood requests, track matches, and connect with your community — all from a single dashboard.",
  },
  donor: {
    eyebrow: "Donor workspace",
    title: "Ready-to-donate coordination",
    description: "Manage your donor profile, review verified requests, and respond to matches without exposing extra personal information.",
  },
  receiver: {
    eyebrow: "Receiver workspace",
    title: "Track urgent requests with clarity",
    description: "Create patient requests, upload supporting slips, and follow each update from review to fulfillment.",
  },
  admin: {
    eyebrow: "Admin operations",
    title: "Review, verify, and coordinate",
    description: "Keep donor approvals, request review, matching, reporting, and audit history in one operational command center.",
  },
  super_admin: {
    eyebrow: "Super admin operations",
    title: "Platform-wide coordination center",
    description: "Monitor system activity, trust signals, and operational workflows across the full platform.",
  },
  operations_agent: {
    eyebrow: "Operations desk",
    title: "Handle active blood coordination",
    description: "Prioritize incoming requests, review reports, and keep urgent coordination moving.",
  },
  hospital_admin: {
    eyebrow: "Hospital workspace",
    title: "Clinical request coordination",
    description: "Publish hospital demand, track active cases, and coordinate donor arrival with a clean operational view.",
  },
  hospital_staff: {
    eyebrow: "Hospital workspace",
    title: "Clinical request coordination",
    description: "Create and manage hospital-side blood requests with clear ownership and status tracking.",
  },
  blood_bank_admin: {
    eyebrow: "Blood bank inventory",
    title: "Traceable stock visibility",
    description: "Track available units, testing status, and inventory movements through a professional dashboard.",
  },
  blood_bank_staff: {
    eyebrow: "Blood bank inventory",
    title: "Traceable stock visibility",
    description: "Monitor blood units, testing progress, and storage detail from a focused staff workspace.",
  },
  institution_donor: {
    eyebrow: "Institution donor workspace",
    title: "Organization-led donor outreach",
    description: "Publish your institution donor profile, handle city-specific requests, and respond to receiver conversations from one structured portal.",
  },
};

export default function Layout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [institutionStatus, setInstitutionStatus] = useState(null);
  const navItems = useMemo(() => {
    const items = navByRole[user?.role] || [];
    if (user?.role === "institution_donor" && institutionStatus && institutionStatus !== "approved") {
      return institutionNavByStatus[institutionStatus] || [];
    }
    return items;
  }, [institutionStatus, user?.role]);
  const currentMeta = useMemo(
    () => {
      if (user?.role === "institution_donor" && institutionStatus === "pending_approval") {
        return {
          eyebrow: "Institution approval",
          title: "Verification in progress",
          description: "Your institution account is under admin review. Institution features unlock only after approval.",
        };
      }
      if (user?.role === "institution_donor" && institutionStatus === "rejected") {
        return {
          eyebrow: "Institution review",
          title: "Corrections required",
          description: "Update the submitted verification details and resubmit the institution for review.",
        };
      }
      if (user?.role === "institution_donor" && institutionStatus === "suspended") {
        return {
          eyebrow: "Institution access",
          title: "Account suspended",
          description: "This institution account is suspended and cannot access institution features until restored by admin.",
        };
      }
      return (
        roleMeta[user?.role] || {
          eyebrow: "BloodLink workspace",
          title: "Secure blood coordination",
          description: "Operational visibility for verified donor and blood request workflows.",
        }
      );
    },
    [institutionStatus, user?.role]
  );

  useEffect(() => {
    if (user?.role !== "institution_donor" || !token) {
      setInstitutionStatus(null);
      return;
    }
    apiRequest("/institutions/me", { token })
      .then((profile) => setInstitutionStatus(profile.status))
      .catch(() => setInstitutionStatus(null));
  }, [token, user?.role]);

  return (
    <div className={`app-shell ${sidebarOpen ? "app-shell-nav-open" : ""}`}>
      <button className="icon-button sidebar-toggle" type="button" onClick={() => setSidebarOpen((current) => !current)} aria-label="Toggle sidebar">
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className={`sidebar-backdrop ${sidebarOpen ? "sidebar-backdrop-visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-panel">
          <div className="brand-mark">
            <Droplets size={18} />
          </div>
          <div>
            <strong>BloodLink</strong>
            <p>Pakistan coordination platform</p>
          </div>
        </div>

        <div className="workspace-chip">
          <ShieldCheck size={16} />
          <span>{currentMeta.eyebrow}</span>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user?.full_name?.slice(0, 1) || "B"}</div>
            <div>
              <p className="muted-label">{String(user?.role || "").replace(/_/g, " ")}</p>
              <strong>{user?.full_name}</strong>
            </div>
          </div>
          <NavLink className="button button-tertiary button-full" to="/" onClick={() => setSidebarOpen(false)}>
            <Home size={16} />
            Public site
          </NavLink>
          <button
            className="button button-secondary button-full"
            onClick={() => {
              logout();
              setSidebarOpen(false);
              navigate("/login");
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="content-panel">
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="top-bar-title">BloodLink</span>
          </div>
          <div className="top-bar-right" />
        </div>
        <main className="page-area">
          <header className="page-header">
          <div className="page-title-group">
            <p className="eyebrow">{currentMeta.eyebrow}</p>
            <h1>{currentMeta.title}</h1>
            <p className="page-description">{currentMeta.description}</p>
          </div>
          <div className="header-actions">
            <div className="header-chip">
              <Building2 size={15} />
              Pakistan-focused healthcare platform
            </div>
            <div className="header-chip header-chip-quiet">Not a transfusion approval system</div>
          </div>
        </header>

        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  </div>
  );
}
