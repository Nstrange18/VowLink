import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import InvitePage from './pages/InvitePage'
import RsvpResponsePage from './pages/RsvpResponsePage'
import NotFoundPage from './pages/NotFoundPage'
import LandingPage from './pages/LandingPage'
import ScrollToTop from './components/ScrollToTop'
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminInvitationsPage from './pages/admin/AdminInvitationsPage'
import AdminNewInvitationPage from './pages/admin/AdminNewInvitationPage'
import AdminEditInvitationPage from './pages/admin/AdminEditInvitationPage'
import AdminRsvpsPage from './pages/admin/AdminRsvpsPage'
import SignupPage from './pages/admin/SignupPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage'
import AdminBillingPage from './pages/admin/AdminBillingPage'
import AdminVenuesPage from './pages/admin/AdminVenuesPage'
import VenueDetailsPage from './pages/admin/VenueDetailsPage'
import AdminBulkInvitationPage from './pages/admin/AdminBulkInvitationPage'
import AdminSeatingPage from './pages/admin/AdminSeatingPage'
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import SuperAdminDashboardPage from './pages/admin/SuperAdminDashboardPage'

// Venue Owner Portal Pages
import VenueLoginPage from './pages/venue/VenueLoginPage'
import VenueRegisterPage from './pages/venue/VenueRegisterPage'
import VenueDashboardPage from './pages/venue/VenueDashboardPage'

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: '#0D1220',
          border: '1px solid rgba(216,183,106,0.2)',
          borderRadius: '16px',
          color: '#fff',
          fontSize: '14px',
        }}
      />
      <ScrollToTop />
      <Routes>
        {/* Default route */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest routes */}
        <Route path="/invite/:slug" element={<InvitePage />} />
        <Route path="/rsvp-response" element={<RsvpResponsePage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password/:token" element={<AdminResetPasswordPage />} />

        {/* Venue Owner Portal */}
        <Route path="/venue/login" element={<VenueLoginPage />} />
        <Route path="/venue/register" element={<VenueRegisterPage />} />
        <Route path="/venue/dashboard" element={<VenueDashboardPage />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="invitations" element={<AdminInvitationsPage />} />
          <Route path="invitations/new" element={<AdminNewInvitationPage />} />
          <Route path="invitations/edit/:id" element={<AdminEditInvitationPage />} />
          <Route path="invitations/bulk" element={<AdminBulkInvitationPage />} />
          <Route path="rsvps" element={<AdminRsvpsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
          <Route path="venues" element={<AdminVenuesPage />} />
          <Route path="venues/:id" element={<VenueDetailsPage />} />
          <Route path="seating" element={<AdminSeatingPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
        </Route>

        {/* Super admin route */}
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
