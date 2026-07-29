import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Icon } from '@iconify/react'

const sidebarGroups = [
  { type: 'link', to: '/admin/dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard', tourId: 'admin-nav-dashboard' },
  {
    type: 'group',
    id: 'invitations',
    label: 'Invitations',
    icon: 'lucide:mail',
    tourId: 'admin-nav-invitations-group',
    children: [
      { to: '/admin/invitations', label: 'Create Invitations', icon: 'lucide:plus-circle', tourId: 'admin-nav-invitations' },
      { to: '/admin/rsvps', label: 'RSVPs', icon: 'lucide:check-square', tourId: 'admin-nav-rsvps', lockedForUnpaid: true, lockReason: 'Choose a plan to collect RSVP responses.' },
      { to: '/admin/whatsapp-bulk', label: 'WhatsApp Sender', icon: 'lucide:message-square', tourId: 'admin-nav-whatsapp', lockedForUnpaid: true, lockReason: 'Choose a plan to send WhatsApp invitations.' },
    ],
  },
  { type: 'link', to: '/admin/seating', label: 'Seating Charts', icon: 'lucide:grid', tourId: 'admin-nav-seating', lockedForUnpaid: true, lockReason: 'Seating chart is available on Pro.' },
  { type: 'link', to: '/admin/billing', label: 'Billings and Tiers', icon: 'lucide:credit-card', tourId: 'admin-nav-billing' },
  { type: 'link', to: '/admin/settings', label: 'Settings', icon: 'lucide:settings', tourId: 'admin-nav-settings' },
]

const SUPPORT_EMAIL = 'hello@vowlink.co'

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'

const getTierLabel = (tier) => {
  if (tier === 'unpaid') return 'trial'
  if (tier === 'free') return 'classic'
  return tier || 'trial'
}

const getTierBadgeClass = (tier) => {
  if (tier === 'pro') return 'bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13] shadow-[0_0_12px_rgba(250,204,21,0.3)] animate-pulse'
  if (tier === 'plus') return 'bg-[#7FA6D9] text-[#070A13]'
  if (tier === 'free') return 'bg-[#D8B76A]/15 text-[#D8B76A] border border-[#D8B76A]/20'
  return 'bg-[#7FA6D9]/10 text-[#B9D4F4] border border-[#7FA6D9]/20'
}

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ invitations: true })
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const tier = user.tier || 'unpaid'
  const isUnpaid = tier === 'unpaid'
  const p1 = user.partner1Name || ''
  const p2 = user.partner2Name || ''
  const initials = `${getInitials(p1)} & ${getInitials(p2)}`
  const coupleName = p1 && p2 ? `${p1} & ${p2}` : 'Your Portal'

  useEffect(() => {
    const handleOpenGroup = (event) => {
      const groupId = event.detail
      if (!groupId) return
      setOpenGroups((current) => ({ ...current, [groupId]: true }))
    }

    window.addEventListener('vowlink:open-sidebar-group', handleOpenGroup)
    return () => window.removeEventListener('vowlink:open-sidebar-group', handleOpenGroup)
  }, [])

  useEffect(() => {
    const activeGroup = sidebarGroups.find(
      (item) => item.type === 'group' && item.children.some((child) => location.pathname.startsWith(child.to))
    )

    if (activeGroup) {
      setOpenGroups((current) => ({ ...current, [activeGroup.id]: true }))
    }
  }, [location.pathname])

  const isLinkActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  const handleLockedNav = (event, to, lockReason) => {
    event.preventDefault()
    toast.info(lockReason || 'Choose a plan to unlock this feature.', { toastId: `locked-${to}` })
    setSidebarOpen(false)
    navigate('/admin/billing')
  }

  const handleLogout = () => {
    toast.dismiss();
    toast.warn(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1 text-white">
          <p className="font-semibold text-xs leading-relaxed">
            Are you sure you want to log out of your wedding portal?
          </p>
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={closeToast}
              className="px-2.5 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                closeToast();
                toast.info("Logged out successfully.");
                navigate('/admin/login');
              }}
              className="px-2.5 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Confirm Logout
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  }

  const SidebarContent = () => (
    <>
      {/* Vowlink Brand */}
      <div data-tour="admin-sidebar-profile" className="border-b border-[#D8B76A]/20 px-5 py-4 shrink-0">
        <div className="mb-4 flex items-center gap-2">
          <img src="/vowlink-icon.svg" alt="" className="h-6 w-6 object-contain opacity-90" />
          <span className="font-serif text-lg tracking-wide text-white">Vowlink</span>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-2">Your Wedding</p>
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex items-center justify-center rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-3 py-1">
            <span className="text-xs font-medium text-[#D8B76A]">{initials}</span>
          </div>
          <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full ${getTierBadgeClass(tier)}`}>
            {getTierLabel(tier)}
          </span>
        </div>
        <h2 className="font-serif text-xl leading-tight text-white">{coupleName}</h2>
        <p className="mt-1 text-xs text-white/30 truncate">{user.email}</p>
        {user.weddingDate && (
          <p className="mt-1 text-xs text-[#D8B76A]/70">
            {new Date(user.weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav data-tour="admin-sidebar-nav" className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
        {sidebarGroups.map((item) => {
          if (item.type === 'group') {
            const isOpen = openGroups[item.id]
            const hasActiveChild = item.children.some((child) => isLinkActive(child.to))

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  data-tour={item.tourId}
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroups((current) => ({ ...current, [item.id]: !current[item.id] }))}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    hasActiveChild
                      ? 'bg-[#D8B76A]/15 text-[#D8B76A]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base flex items-center justify-center">
                    <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">{item.label}</span>
                  <Icon
                    icon="lucide:chevron-down"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className="admin-sidebar-subnav"
                  data-open={isOpen}
                  aria-hidden={!isOpen}
                  style={{ '--subnav-height': `${item.children.length * 47 + 18}px` }}
                >
                  <div className="admin-sidebar-subnav__inner ml-5 space-y-1 border-l border-white/10 pl-3 pt-1 pb-1">
                    {item.children.map(({ to, label, icon, tourId, lockedForUnpaid, lockReason }) => {
                      const locked = isUnpaid && lockedForUnpaid
                      return (
                        <NavLink
                          key={to}
                          to={to}
                          data-tour={tourId}
                          tabIndex={isOpen ? undefined : -1}
                          aria-hidden={!isOpen}
                          onClick={(event) => {
                            if (locked) {
                              handleLockedNav(event, to, lockReason)
                              return
                            }
                            setSidebarOpen(false)
                          }}
                          title={locked ? lockReason : undefined}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                              locked
                                ? 'text-white/35 hover:bg-white/5'
                                : isActive
                                  ? 'bg-[#D8B76A]/15 text-[#D8B76A]'
                                  : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`
                          }
                        >
                          <Icon icon={icon} className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1">{label}</span>
                          {locked && <Icon icon="lucide:lock" className="h-3.5 w-3.5 shrink-0 text-white/25" />}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          const locked = isUnpaid && item.lockedForUnpaid
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-tour={item.tourId}
              onClick={(event) => {
                if (locked) {
                  handleLockedNav(event, item.to, item.lockReason)
                  return
                }
                setSidebarOpen(false)
              }}
              title={locked ? item.lockReason : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  locked
                    ? 'text-white/35 hover:bg-white/5'
                    : isActive
                      ? 'bg-[#D8B76A]/15 text-[#D8B76A]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-base flex items-center justify-center">
                <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
              </span>
              <span className="min-w-0 flex-1">{item.label}</span>
              {locked && <Icon icon="lucide:lock" className="h-3.5 w-3.5 shrink-0 text-white/25" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Footer actions (pinned at bottom, with border separator and mt-auto gap) */}
      <div data-tour="admin-sidebar-actions" className="mt-auto border-t border-[#D8B76A]/20 pt-4 bg-[#090D19] shrink-0">
        {user.role === 'admin' && user.email?.toLowerCase() === 'nwubachukwuemelie@gmail.com' && (
          <div className="px-4 pb-3">
            <Link
              to="/super-admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all duration-200"
            >
              <Icon icon="lucide:shield-alert" className="w-4 h-4 shrink-0" />
              Super Admin Panel
            </Link>
          </div>
        )}

        <div className="px-4 pb-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=VowLink%20support%20request`}
            data-tour="admin-nav-support"
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <Icon icon="lucide:headphones" className="w-4 h-4 shrink-0" /> Contact support
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <Icon icon="lucide:log-out" className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="relative h-screen w-full overflow-hidden overflow-x-clip bg-[#070A13]">
      {/* ── Mobile sidebar overlay ────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r border-[#D8B76A]/20 bg-[#090D19] transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main layout flex flow ── */}
      <div className="flex h-full w-full overflow-hidden">
        {/* ── Desktop sidebar (lg+) ─────────────────────────────── */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-[#D8B76A]/20 bg-[#090D19] h-full shrink-0">
          <SidebarContent />
        </aside>

        {/* ── Main area ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile topbar */}
          <header className="flex items-center justify-between gap-2 border-b border-[#D8B76A]/20 bg-[#090D19] px-3 py-3 pr-16 sm:px-4 sm:pr-28 lg:hidden shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              data-tour="admin-mobile-menu"
              className="flex flex-col gap-1.5 p-1 text-white/60 hover:text-white transition"
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-6 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-6 rounded bg-current" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
              <img src="/vowlink-icon.svg" alt="" className="h-5 w-5 object-contain opacity-80" />
              <span className="min-w-0 truncate font-serif text-sm text-white sm:text-base">Vowlink</span>
              <span className={`text-[7px] sm:text-[8px] uppercase font-bold tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full ${getTierBadgeClass(tier)}`}>
                {getTierLabel(tier)}
              </span>
            </div>
            <div className="flex shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-1.5 py-0.5 sm:px-2">
              <span className="max-w-14 truncate text-[10px] font-medium text-[#D8B76A] sm:max-w-none sm:text-xs">{initials}</span>
            </div>
          </header>

          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
