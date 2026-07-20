import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import InstitutionRouteGuard from "./components/InstitutionRouteGuard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import BloodRequestsPage from "./pages/admin/BloodRequestsPage";
import DonorsPage from "./pages/admin/DonorsPage";
import MatchesPage from "./pages/admin/MatchesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import UsersPage from "./pages/admin/UsersPage";
import AdminBloodBanksPage from "./pages/admin/AdminBloodBanksPage";
import AdminInstitutionsPage from "./pages/admin/AdminInstitutionsPage";
import BloodBankAppointmentsPage from "./pages/bloodbank/BloodBankAppointmentsPage";
import BloodBankCityRequestsPage from "./pages/bloodbank/BloodBankCityRequestsPage";
import BloodBankDashboardPage from "./pages/bloodbank/BloodBankDashboardPage";
import BloodBankDrivesPage from "./pages/bloodbank/BloodBankDrivesPage";
import BloodBankInventoryPage from "./pages/bloodbank/BloodBankInventoryPage";
import BloodBankAnalyticsPage from "./pages/bloodbank/BloodBankAnalyticsPage";
import BloodBankProfilePage from "./pages/bloodbank/BloodBankProfilePage";
import BloodUnitDetailPage from "./pages/bloodbank/BloodUnitDetailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DonorDashboardPage from "./pages/donor/DonorDashboardPage";
import DonorChatPage from "./pages/donor/DonorChatPage";
import DonorProfilePage from "./pages/donor/DonorProfilePage";
import MyMatchesPage from "./pages/donor/MyMatchesPage";
import NotificationsPage from "./pages/donor/NotificationsPage";
import InstitutionDashboardPage from "./pages/institution/InstitutionDashboardPage";
import InstitutionMessagesPage from "./pages/institution/InstitutionMessagesPage";
import InstitutionProfilePage from "./pages/institution/InstitutionProfilePage";
import InstitutionRejectedPage from "./pages/institution/InstitutionRejectedPage";
import InstitutionSuspendedPage from "./pages/institution/InstitutionSuspendedPage";
import InstitutionVerificationPendingPage from "./pages/institution/InstitutionVerificationPendingPage";
import AboutPage from "./pages/public/AboutPage";
import BloodBankBrowsePage from "./pages/public/BloodBankBrowsePage";
import BloodBankPublicProfilePage from "./pages/public/BloodBankProfilePage";
import BloodRadarPage from "./pages/public/BloodRadarPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import HowItWorksPage from "./pages/public/HowItWorksPage";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterBloodBankPage from "./pages/public/RegisterBloodBankPage";
import RegisterPage from "./pages/public/RegisterPage";
import RegisterInstitutionPage from "./pages/public/RegisterInstitutionPage";
import AvailableDonorsPage from "./pages/receiver/AvailableDonorsPage";
import BloodBanksInCityPage from "./pages/receiver/BloodBanksInCityPage";
import CreateRequestPage from "./pages/receiver/CreateRequestPage";
import InstitutionsInCityPage from "./pages/receiver/InstitutionsInCityPage";
import MatchedDonorsPage from "./pages/receiver/MatchedDonorsPage";
import MyRequestsPage from "./pages/receiver/MyRequestsPage";
import ReceiverChatPage from "./pages/receiver/ReceiverChatPage";
import ReceiverDashboardPage from "./pages/receiver/ReceiverDashboardPage";
import RequestDetailsPage from "./pages/receiver/RequestDetailsPage";

export default function App() {
  const location = useLocation();
  const adminRoles = ["admin", "super_admin", "operations_agent"];

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/institution" element={<RegisterInstitutionPage />} />
        <Route path="/register/blood-bank" element={<RegisterBloodBankPage />} />
        <Route path="/blood-banks" element={<BloodBankBrowsePage />} />
        <Route path="/blood-banks/:id" element={<BloodBankPublicProfilePage />} />
        <Route path="/blood-radar" element={<BloodRadarPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["member"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor"
            element={
              <ProtectedRoute roles={["member"]}>
                <DonorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/profile"
            element={
              <ProtectedRoute roles={["member"]}>
                <DonorProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/requests"
            element={
              <ProtectedRoute roles={["member"]}>
                <Navigate to="/donor/matches" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/matches"
            element={
              <ProtectedRoute roles={["member"]}>
                <MyMatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/notifications"
            element={
              <ProtectedRoute roles={["member"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/chats"
            element={
              <ProtectedRoute roles={["member"]}>
                <DonorChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receiver"
            element={
              <ProtectedRoute roles={["member"]}>
                <ReceiverDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/create-request"
            element={
              <ProtectedRoute roles={["member"]}>
                <CreateRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/requests"
            element={
              <ProtectedRoute roles={["member"]}>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/requests/:requestId"
            element={
              <ProtectedRoute roles={["member"]}>
                <RequestDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/matched-donors"
            element={
              <ProtectedRoute roles={["member"]}>
                <MatchedDonorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/available-donors"
            element={
              <ProtectedRoute roles={["member"]}>
                <AvailableDonorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/blood-banks"
            element={
              <ProtectedRoute roles={["member"]}>
                <BloodBanksInCityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/institutions"
            element={
              <ProtectedRoute roles={["member"]}>
                <InstitutionsInCityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiver/chats"
            element={
              <ProtectedRoute roles={["member"]}>
                <ReceiverChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={adminRoles}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={adminRoles}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/donors"
            element={
              <ProtectedRoute roles={adminRoles}>
                <DonorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute roles={adminRoles}>
                <BloodRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/institutions"
            element={
              <ProtectedRoute roles={adminRoles}>
                <AdminInstitutionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blood-banks"
            element={
              <ProtectedRoute roles={adminRoles}>
                <AdminBloodBanksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedRoute roles={adminRoles}>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={adminRoles}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute roles={adminRoles}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blood-bank"
            element={
              <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>
                <BloodBankDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/inventory"
            element={
              <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>
                <BloodBankInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/create-unit"
            element={
              <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>
                <BloodBankInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/city-requests"
            element={
              <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>
                <BloodBankCityRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/drives"
            element={
              <ProtectedRoute roles={["blood_bank_admin"]}>
                <BloodBankDrivesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/appointments"
            element={
              <ProtectedRoute roles={["blood_bank_admin"]}>
                <BloodBankAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/analytics"
            element={
              <ProtectedRoute roles={["blood_bank_admin"]}>
                <BloodBankAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/profile"
            element={
              <ProtectedRoute roles={["blood_bank_admin"]}>
                <BloodBankProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blood-bank/units/:unitId"
            element={
              <ProtectedRoute roles={["blood_bank_admin", "blood_bank_staff"]}>
                <BloodUnitDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/institution"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["approved"]}>
                  <InstitutionDashboardPage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/profile"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["approved"]}>
                  <InstitutionProfilePage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/messages"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["approved"]}>
                  <InstitutionMessagesPage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/verification-pending"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["pending"]}>
                  <InstitutionVerificationPendingPage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/rejected"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["rejected"]}>
                  <InstitutionRejectedPage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/suspended"
            element={
              <ProtectedRoute roles={["institution_donor"]}>
                <InstitutionRouteGuard allowedStatuses={["suspended"]}>
                  <InstitutionSuspendedPage />
                </InstitutionRouteGuard>
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
