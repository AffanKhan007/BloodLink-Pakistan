import {
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileClock,
  HeartHandshake,
  Home,
  Info,
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
    title: "Everything you need, in one place",
    description: "Track your requests, manage your donor profile, and message matches from here.",
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
    eyebrow: "Admin",
    title: "Operations overview",
    description: "Review requests, verify institutions, and monitor activity across the platform.",
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
    eyebrow: "Blood bank workspace",
    title: "Manage your inventory and demand",
    description: "Track blood unit stock, monitor city-wide requests, and update availability.",
  },
  blood_bank_staff: {
    eyebrow: "Blood bank workspace",
    title: "Manage your inventory and demand",
    description: "Track blood unit stock, monitor city-wide requests, and update availability.",
  },
  institution_donor: {
    eyebrow: "Institution workspace",
    title: "Manage your organization's donor activity",
    description: "Update your profile, respond to nearby requests, and message receivers directly.",
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
        {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
      </button>

      <div className={`sidebar-backdrop ${sidebarOpen ? "sidebar-backdrop-visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-panel">
          <div className="brand-mark">
            <Droplets size={15} />
          </div>
          <div>
            <strong>BloodLink</strong>
            <p>Pakistan coordination platform</p>
          </div>
        </div>

        <div className="workspace-chip">
          <ShieldCheck size={14} />
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
              <span className="nav-link-body">
                <item.icon size={15} />
                <span>{item.label}</span>
              </span>
              <span className="nav-link-arrow">
                <svg width="18" height="12" viewBox="0 0 66 43" xmlns="http://www.w3.org/2000/svg">
                  <path className="arrow-path one" d="M40.1543933,3.89485454 L43.9763149,0.139296592 C44.1708311,-0.0518420739 44.4826329,-0.0518571125 44.6771675,0.139262789 L65.6916134,20.7848311 C66.0855801,21.1718824 66.0911863,21.8050225 65.704135,22.1989893 C65.7000188,22.2031791 65.6958657,22.2073326 65.6916762,22.2114492 L44.677098,42.8607841 C44.4825957,43.0519059 44.1708242,43.0519358 43.9762853,42.8608513 L40.1545186,39.1069479 C39.9575152,38.9134427 39.9546793,38.5968729 40.1481845,38.3998695 C40.1502893,38.3977268 40.1524132,38.395603 40.1545562,38.3934985 L56.9937789,21.8567812 C57.1908028,21.6632968 57.193672,21.3467273 57.0001876,21.1497035 C56.9980647,21.1475418 56.9959223,21.1453995 56.9937605,21.1432767 L40.1545208,4.60825197 C39.9574869,4.41477773 39.9546013,4.09820839 40.1480756,3.90117456 C40.1501626,3.89904911 40.1522686,3.89694235 40.1543933,3.89485454 Z" />
                  <path className="arrow-path two" d="M20.1543933,3.89485454 L23.9763149,0.139296592 C24.1708311,-0.0518420739 24.4826329,-0.0518571125 24.6771675,0.139262789 L45.6916134,20.7848311 C46.0855801,21.1718824 46.0911863,21.8050225 45.704135,22.1989893 C45.7000188,22.2031791 45.6958657,22.2073326 45.6916762,22.2114492 L24.677098,42.8607841 C24.4825957,43.0519059 24.1708242,43.0519358 23.9762853,42.8608513 L20.1545186,39.1069479 C19.9575152,38.9134427 19.9546793,38.5968729 20.1481845,38.3998695 C20.1502893,38.3977268 20.1524132,38.395603 20.1545562,38.3934985 L36.9937789,21.8567812 C37.1908028,21.6632968 37.193672,21.3467273 37.0001876,21.1497035 C36.9980647,21.1475418 36.9959223,21.1453995 36.9937605,21.1432767 L20.1545208,4.60825197 C19.9574869,4.41477773 19.9546013,4.09820839 20.1480756,3.90117456 C20.1501626,3.89904911 20.1522686,3.89694235 20.1543933,3.89485454 Z" />
                  <path className="arrow-path three" d="M0.154393339,3.89485454 L3.97631488,0.139296592 C4.17083111,-0.0518420739 4.48263286,-0.0518571125 4.67716753,0.139262789 L25.6916134,20.7848311 C26.0855801,21.1718824 26.0911863,21.8050225 25.704135,22.1989893 C25.7000188,22.2031791 25.6958657,22.2073326 25.6916762,22.2114492 L4.67709797,42.8607841 C4.48259567,43.0519059 4.17082418,43.0519358 3.97628526,42.8608513 L0.154518591,39.1069479 C-0.0424848215,38.9134427 -0.0453206733,38.5968729 0.148184538,38.3998695 C0.150289256,38.3977268 0.152413239,38.395603 0.154556228,38.3934985 L16.9937789,21.8567812 C17.1908028,21.6632968 17.193672,21.3467273 17.0001876,21.1497035 C16.9980647,21.1475418 16.9959223,21.1453995 16.9937605,21.1432767 L0.15452076,4.60825197 C-0.0425130651,4.41477773 -0.0453986756,4.09820839 0.148075568,3.90117456 C0.150162624,3.89904911 0.152268631,3.89694235 0.154393339,3.89485454 Z" />
                </svg>
              </span>
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
            <Home size={14} />
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
            <LogOut size={14} />
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
            <span className="header-disclaimer">
              <Info size={11} />
              Not a transfusion approval system
            </span>
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
