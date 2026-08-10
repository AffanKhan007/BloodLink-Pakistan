import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
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
  Radar,
  Search,
  ShieldCheck,
  Syringe,
  University,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PageTransition from "./PageTransition";

const navByRole = {
  member: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", to: "/donor/profile", icon: Users },
    { label: "Create Request", to: "/receiver/create-request", icon: Droplets },
    { label: "My Requests", to: "/receiver/requests", icon: ClipboardList },
    { label: "My Matches", to: "/donor/matches", icon: HeartHandshake },
    { label: "Available Donors", to: "/receiver/available-donors", icon: Search },
    { label: "Blood Banks", to: "/blood-banks", icon: Warehouse },
    { label: "Blood Radar", to: "/blood-radar", icon: Radar },
    { label: "Institutions", to: "/receiver/institutions", icon: University },
    { label: "Notifications", to: "/donor/notifications", icon: Bell },
    { label: "Chats", to: "/donor/chats", icon: MessageSquare },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Donors", to: "/admin/donors", icon: Syringe },
    { label: "Institutions", to: "/admin/institutions", icon: Building2 },
    { label: "Blood Banks", to: "/admin/blood-banks", icon: Warehouse },
    { label: "Blood Requests", to: "/admin/requests", icon: Droplets },
    { label: "Matches", to: "/admin/matches", icon: HeartHandshake },
    { label: "Reports", to: "/admin/reports", icon: ClipboardCheck },
    { label: "Audit Logs", to: "/admin/audit-logs", icon: FileClock },
  ],
  blood_bank_admin: [
    { label: "Dashboard", to: "/blood-bank", icon: LayoutDashboard },
    { label: "Inventory", to: "/blood-bank/inventory", icon: Warehouse },
    { label: "City Requests", to: "/blood-bank/city-requests", icon: ClipboardList },
    { label: "Donation Drives", to: "/blood-bank/drives", icon: Droplets },
    { label: "Appointments", to: "/blood-bank/appointments", icon: CalendarClock },
    { label: "Analytics", to: "/blood-bank/analytics", icon: BarChart3 },
    { label: "Profile", to: "/blood-bank/profile", icon: Building2 },
  ],
  blood_bank_staff: [
    { label: "Dashboard", to: "/blood-bank", icon: LayoutDashboard },
    { label: "Inventory", to: "/blood-bank/inventory", icon: Warehouse },
    { label: "City Requests", to: "/blood-bank/city-requests", icon: ClipboardList },
  ],
  institution_donor: [
    { label: "Dashboard", to: "/institution", icon: LayoutDashboard },
    { label: "Profile", to: "/institution/profile", icon: Building2 },
    { label: "Messages", to: "/institution/messages", icon: MessageSquare },
  ],
};

const institutionNavByStatus = {
  pending: [{ label: "Verification Status", to: "/institution/verification-pending", icon: ShieldCheck }],
  rejected: [{ label: "Verification Review", to: "/institution/rejected", icon: ShieldCheck }],
  suspended: [{ label: "Account Status", to: "/institution/suspended", icon: ShieldCheck }],
};

const roleMeta = {
  member: {
    eyebrow: "Workspace",
    title: "Blood coordination",
    description: "Manage requests, donor details, and messages.",
  },
  admin: {
    eyebrow: "Admin",
    title: "Operations overview",
    description: "Review requests, institutions, and reports.",
  },
  blood_bank_admin: {
    eyebrow: "Blood bank",
    title: "Blood bank workspace",
    description: "Manage inventory, fulfillment, drives, and appointments.",
  },
  blood_bank_staff: {
    eyebrow: "Blood bank",
    title: "Inventory workspace",
    description: "Track stock and monitor city-wide requests.",
  },
  institution_donor: {
    eyebrow: "Institution",
    title: "Institution workspace",
    description: "Manage profile and receiver messages.",
  },
};

export default function Layout({ children }) {
  const { token, user, logout } = useAuth();
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const pageAreaRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [institutionStatus, setInstitutionStatus] = useState(null);

  useEffect(() => {
    const pageArea = document.querySelector(".page-area");
    if (pageArea) pageArea.scrollTop = 0;
  }, [pathname]);
  const navItems = useMemo(() => {
    const items = navByRole[user?.role] || [];
    if (user?.role === "institution_donor" && institutionStatus && institutionStatus !== "approved") {
      return institutionNavByStatus[institutionStatus] || [];
    }
    return items;
  }, [institutionStatus, user?.role]);
  const currentMeta = useMemo(
    () => {
      if (user?.role === "institution_donor" && institutionStatus === "pending") {
        return {
          eyebrow: "Institution approval",
          title: "Verification in progress",
          description: "Institution features unlock after admin approval.",
        };
      }
      if (user?.role === "institution_donor" && institutionStatus === "rejected") {
        return {
          eyebrow: "Institution review",
          title: "Corrections required",
          description: "Update details and resubmit for review.",
        };
      }
      if (user?.role === "institution_donor" && institutionStatus === "suspended") {
        return {
          eyebrow: "Institution access",
          title: "Account suspended",
          description: "Access is locked until admin restores it.",
        };
      }
      return (
        roleMeta[user?.role] || {
          eyebrow: "BloodLink workspace",
          title: "Secure blood coordination",
          description: "Verified request and donor workflows.",
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
            <Link
              key={item.to}
              href={item.to}
              className={pathname === item.to ? "nav-link nav-link-active" : "nav-link"}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-link-body">
                <item.icon size={15} />
                <span>{item.label}</span>
              </span>
            </Link>
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
          <Link className="button button-tertiary button-full" href="/" onClick={() => setSidebarOpen(false)}>
            <Home size={14} />
            Public site
          </Link>
          <button
            className="button button-secondary button-full"
            onClick={() => {
              logout();
              setSidebarOpen(false);
              router.push("/login");
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
          <div className="top-bar-right">
            <button
              className="nav-lang-toggle"
              onClick={() => {
                const next = i18n.language === 'ur' ? 'en' : 'ur';
                i18n.changeLanguage(next);
                document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr';
                document.documentElement.lang = next;
              }}
              title={i18n.language === 'ur' ? 'Switch to English' : 'اردو میں تبدیل کریں'}
            >
              {i18n.language === 'ur' ? 'EN' : 'اردو'}
            </button>
          </div>
        </div>
        <main className="page-area">
          <header className="page-header">
          <div className="page-title-group">
            <p className="eyebrow">{currentMeta.eyebrow}</p>
            <h1>{currentMeta.title}</h1>
            <p className="page-description">{currentMeta.description}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
          >
            <PageTransition>
              {children}
            </PageTransition>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
  );
}
