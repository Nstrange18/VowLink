import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import ThemeToggle from './components/ThemeToggle'

const InvitePage = lazy(() => import('./pages/InvitePage'))
const RsvpResponsePage = lazy(() => import('./pages/RsvpResponsePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminInvitationsPage = lazy(() => import('./pages/admin/AdminInvitationsPage'))
const AdminNewInvitationPage = lazy(() => import('./pages/admin/AdminNewInvitationPage'))
const AdminEditInvitationPage = lazy(() => import('./pages/admin/AdminEditInvitationPage'))
const AdminRsvpsPage = lazy(() => import('./pages/admin/AdminRsvpsPage'))
const SignupPage = lazy(() => import('./pages/admin/SignupPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const AdminTemplatesPage = lazy(() => import('./pages/admin/AdminTemplatesPage'))
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage'))
const AdminVenuesPage = lazy(() => import('./pages/admin/AdminVenuesPage'))
const VenueDetailsPage = lazy(() => import('./pages/admin/VenueDetailsPage'))
const AdminBulkInvitationPage = lazy(() => import('./pages/admin/AdminBulkInvitationPage'))
const AdminBulkWhatsAppPage = lazy(() => import('./pages/admin/AdminBulkWhatsAppPage'))
const AdminSeatingPage = lazy(() => import('./pages/admin/AdminSeatingPage'))
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const SuperAdminDashboardPage = lazy(() => import('./pages/admin/SuperAdminDashboardPage'))
const VenueLoginPage = lazy(() => import('./pages/venue/VenueLoginPage'))
const VenueRegisterPage = lazy(() => import('./pages/venue/VenueRegisterPage'))
const VenueDashboardPage = lazy(() => import('./pages/venue/VenueDashboardPage'))

const APP_THEME_KEY = 'vowlink-theme'
const GUEST_THEME_KEY = 'vowlink-guest-theme'

const readStoredTheme = (key) => {
  const savedTheme = localStorage.getItem(key)
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
}

const RouteFallback = () => (
  <div className="min-h-screen bg-[#070A13] text-white flex items-center justify-center text-xs uppercase tracking-widest">
    Loading...
  </div>
)

function AppContent() {
  const location = useLocation()
  const isInviteRoute = location.pathname.startsWith('/invite/')
  const activeThemeKey = isInviteRoute ? GUEST_THEME_KEY : APP_THEME_KEY
  const [theme, setTheme] = useState(() => readStoredTheme(APP_THEME_KEY) || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('vowlink-light', theme === 'light')
    document.body.classList.toggle('vowlink-light', theme === 'light')
  }, [theme])

  useEffect(() => {
    const routeTheme = readStoredTheme(activeThemeKey)
    if (routeTheme) {
      setTheme(routeTheme)
    } else if (!isInviteRoute) {
      setTheme(readStoredTheme(APP_THEME_KEY) || 'dark')
    }
  }, [activeThemeKey, isInviteRoute])

  const setThemePreference = (nextTheme, { savePreference = true } = {}) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') return
    setTheme(nextTheme)
    if (savePreference) {
      localStorage.setItem(activeThemeKey, nextTheme)
    }
  }

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === 'light' ? 'dark' : 'light'
      localStorage.setItem(activeThemeKey, nextTheme)
      return nextTheme
    })
  }

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={theme}
        toastStyle={{
          background: theme === 'light' ? '#fffaf0' : '#0D1220',
          border: '1px solid rgba(216,183,106,0.2)',
          borderRadius: '16px',
          color: theme === 'light' ? '#1f2933' : '#fff',
          fontSize: '14px',
        }}
      />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<LandingPage />} />

        {/* Guest routes */}
        <Route path="/invite/:slug" element={<InvitePage setThemePreference={setThemePreference} />} />
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
          <Route path="whatsapp-bulk" element={<AdminBulkWhatsAppPage />} />
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
      </Suspense>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
