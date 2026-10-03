import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import ThemeToggle from './components/ThemeToggle'
import SEO from './components/SEO'
import VowLinkLoader from './components/VowLinkLoader'
import NetworkStatusBanner from './components/NetworkStatusBanner'
import { trackVisit } from './utils/visitTracker'

const InvitePage = lazy(() => import('./pages/InvitePage'))
const CheckInPage = lazy(() => import('./pages/CheckInPage'))
const CheckInStaffPage = lazy(() => import('./pages/CheckInStaffPage'))
const RsvpResponsePage = lazy(() => import('./pages/RsvpResponsePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const MarketingPage = lazy(() => import('./pages/MarketingPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
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
const AdminBulkInvitationPage = lazy(() => import('./pages/admin/AdminBulkInvitationPage'))
const AdminBulkWhatsAppPage = lazy(() => import('./pages/admin/AdminBulkWhatsAppPage'))
const AdminSeatingPage = lazy(() => import('./pages/admin/AdminSeatingPage'))
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const SuperAdminDashboardPage = lazy(() => import('./pages/admin/SuperAdminDashboardPage'))

const APP_THEME_KEY = 'vowlink-theme'
const GUEST_THEME_PREFIX = 'vowlink_guest_theme_'

const PUBLIC_ROUTE_META = {
  '/': {
    title: 'VowLink | Digital Wedding Invitations, RSVP Tracking and Guest Planning',
    description: 'Create elegant digital wedding invitations, send personalized guest links, collect RSVPs, manage WhatsApp sharing, and organize wedding details in one VowLink portal.',
  },
  '/features': {
    title: 'VowLink Features | Wedding Invitations, RSVPs and Guest Planning',
    description: 'Explore VowLink features for personalized wedding invite links, RSVP tracking, WhatsApp sharing, guest categories, seating tools, and templates.',
  },
  '/pricing': {
    title: 'VowLink Pricing | Digital Wedding Invitation Plans',
    description: 'Compare VowLink wedding invitation plans for couples, from the Classic starter invite to premium RSVP tracking, templates, guest exports, and planning tools.',
  },
  '/templates': {
    title: 'VowLink Templates | Elegant Digital Wedding Invitation Designs',
    description: 'Browse VowLink digital wedding invitation template options for formal weddings, photo-led invite cards, custom colors, music, galleries, and guest details.',
  },
  '/privacy': {
    title: 'VowLink Privacy Policy',
    description: 'Read the VowLink Privacy Policy for digital wedding invitations, RSVP tools, guest data, WhatsApp invitations, and account information.',
  },
  '/terms': {
    title: 'VowLink Terms of Service',
    description: 'Read the VowLink Terms of Service for digital wedding invitations, RSVP tools, guest management, and WhatsApp invitation workflows.',
  },
}

const isPrivateRoute = (pathname) => (
  pathname.startsWith('/admin') ||
  pathname.startsWith('/super-admin') ||
  pathname.startsWith('/signup') ||
  pathname.startsWith('/rsvp-response') ||
  pathname.startsWith('/check-in/') ||
  pathname.startsWith('/invite/')
)

const RouteMetadata = () => {
  const { pathname } = useLocation()
  const publicMeta = PUBLIC_ROUTE_META[pathname]

  if (publicMeta) {
    return <SEO {...publicMeta} path={pathname} />
  }

  if (isPrivateRoute(pathname)) {
    return (
      <SEO
        title="VowLink Private Wedding Portal"
        description="Private VowLink wedding portal page for couples, guests, or administrators."
        path={pathname}
        noindex
      />
    )
  }

  return (
    <SEO
      title="VowLink"
      description="Digital wedding invitations, RSVP tracking, and guest planning tools."
      path={pathname}
      noindex
    />
  )
}

const getInviteThemeKey = (pathname) => {
  const slug = pathname.match(/^\/invite\/([^/?#]+)/)?.[1]
  return slug ? `${GUEST_THEME_PREFIX}${slug}` : null
}

const readStoredTheme = (key) => {
  if (!key) return null
  const savedTheme = localStorage.getItem(key)
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
}

const RouteFallback = () => <VowLinkLoader />

function AppContent() {
  const location = useLocation()
  const isInviteRoute = location.pathname.startsWith('/invite/')
  const activeThemeKey = isInviteRoute ? getInviteThemeKey(location.pathname) : APP_THEME_KEY
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

  useEffect(() => {
    trackVisit({
      pathname: location.pathname,
      search: location.search,
    })
  }, [location.pathname, location.search])

  const setThemePreference = useCallback((nextTheme, { savePreference = true } = {}) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') return
    setTheme(nextTheme)
    if (savePreference && activeThemeKey) {
      localStorage.setItem(activeThemeKey, nextTheme)
    }
  }, [activeThemeKey])

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === 'light' ? 'dark' : 'light'
      if (activeThemeKey) {
        localStorage.setItem(activeThemeKey, nextTheme)
      }
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
      <NetworkStatusBanner />
      <Analytics />
      <SpeedInsights />
      <RouteMetadata />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Default route */}
          {/* Commit message route */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<MarketingPage page="features" />} />
          <Route path="/pricing" element={<MarketingPage page="pricing" />} />
          <Route path="/templates" element={<MarketingPage page="templates" />} />
          <Route path="/privacy" element={<LegalPage page="privacy" />} />
          <Route path="/terms" element={<LegalPage page="terms" />} />

        {/* Guest routes */}
        <Route path="/invite/:slug" element={<InvitePage setThemePreference={setThemePreference} />} />
        <Route path="/check-in/staff" element={<CheckInStaffPage />} />
        <Route path="/check-in/:token" element={<CheckInPage />} />
        <Route path="/rsvp-response" element={<RsvpResponsePage />} />

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
          <Route path="invitations/bulk" element={<AdminBulkInvitationPage />} />
          <Route path="whatsapp-bulk" element={<AdminBulkWhatsAppPage />} />
          <Route path="rsvps" element={<AdminRsvpsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
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
