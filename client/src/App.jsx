import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import InvitePage from './pages/InvitePage'
import RsvpSuccessPage from './pages/RsvpSuccessPage'
import NotFoundPage from './pages/NotFoundPage'
import LandingPage from './pages/LandingPage'

import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminInvitationsPage from './pages/admin/AdminInvitationsPage'
import AdminNewInvitationPage from './pages/admin/AdminNewInvitationPage'
import AdminEditInvitationPage from './pages/admin/AdminEditInvitationPage'
import AdminRsvpsPage from './pages/admin/AdminRsvpsPage'
import SignupPage from './pages/admin/SignupPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage'
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage'

import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest routes */}
        <Route path="/invite/:slug" element={<InvitePage />} />
        <Route path="/rsvp-success" element={<RsvpSuccessPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password/:token" element={<AdminResetPasswordPage />} />

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
          <Route path="rsvps" element={<AdminRsvpsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
