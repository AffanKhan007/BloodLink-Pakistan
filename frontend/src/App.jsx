import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import BloodRequestsPage from "./pages/admin/BloodRequestsPage";
import DonorsPage from "./pages/admin/DonorsPage";
import MatchesPage from "./pages/admin/MatchesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import UsersPage from "./pages/admin/UsersPage";
import BloodBankCityRequestsPage from "./pages/bloodbank/BloodBankCityRequestsPage";
import BloodBankDashboardPage from "./pages/bloodbank/BloodBankDashboardPage";
import DonorDashboardPage from "./pages/donor/DonorDashboardPage";
import DonorChatPage from "./pages/donor/DonorChatPage";
import DonorProfilePage from "./pages/donor/DonorProfilePage";
import MatchingRequestsPage from "./pages/donor/MatchingRequestsPage";
import MyMatchesPage from "./pages/donor/MyMatchesPage";
import NotificationsPage from "./pages/donor/NotificationsPage";
import BloodBankInventoryPage from "./pages/bloodbank/BloodBankInventoryPage";
import BloodUnitDetailPage from "./pages/bloodbank/BloodUnitDetailPage";
import HospitalDashboardPage from "./pages/hospital/HospitalDashboardPage";
import HospitalRequestsPage from "./pages/hospital/HospitalRequestsPage";
import InstitutionDashboardPage from "./pages/institution/InstitutionDashboardPage";
import InstitutionMessagesPage from "./pages/institution/InstitutionMessagesPage";
import InstitutionProfilePage from "./pages/institution/InstitutionProfilePage";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import AboutPage from "./pages/public/AboutPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import HowItWorksPage from "./pages/public/HowItWorksPage";
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
  const adminRoles = ["admin", "super_admin", "operations_agent"];

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/donor"
          element={
            <ProtectedRoute roles={["donor"]}>
              <DonorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/profile"
          element={
            <ProtectedRoute roles={["donor"]}>
              <DonorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/requests"
          element={
            <ProtectedRoute roles={["donor"]}>
              <MatchingRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/matches"
          element={
            <ProtectedRoute roles={["donor"]}>
              <MyMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/notifications"
          element={
            <ProtectedRoute roles={["donor"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/chats"
          element={
            <ProtectedRoute roles={["donor"]}>
              <DonorChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receiver"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <ReceiverDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/create-request"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <CreateRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/requests"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/requests/:requestId"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <RequestDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/matched-donors"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <MatchedDonorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/available-donors"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <AvailableDonorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/blood-banks"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <BloodBanksInCityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/institutions"
          element={
            <ProtectedRoute roles={["receiver"]}>
              <InstitutionsInCityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver/chats"
          element={
            <ProtectedRoute roles={["receiver"]}>
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
          path="/hospital"
          element={
            <ProtectedRoute roles={["hospital_admin", "hospital_staff"]}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/requests"
          element={
            <ProtectedRoute roles={["hospital_admin", "hospital_staff"]}>
              <HospitalRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/create-request"
          element={
            <ProtectedRoute roles={["hospital_admin", "hospital_staff"]}>
              <HospitalRequestsPage />
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
              <InstitutionDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/profile"
          element={
            <ProtectedRoute roles={["institution_donor"]}>
              <InstitutionProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institution/messages"
          element={
            <ProtectedRoute roles={["institution_donor"]}>
              <InstitutionMessagesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
