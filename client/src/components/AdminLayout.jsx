import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/admin/invitations', label: 'Invitations', icon: '✉' },
  { to: '/admin/rsvps', label: 'RSVPs', icon: '✓' },
  { to: '/admin/venues', label: 'Suggested Venues', icon: '📍' },
  { to: '/admin/billing', label: 'Billing & Tiers', icon: '💳' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
]

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'

const AdminLayout = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const p1 = user.partner1Name || ''
  const p2 = user.partner2Name || ''
  const initials = `${getInitials(p1)} & ${getInitials(p2)}`
  const coupleName = p1 && p2 ? `${p1} & ${p2}` : 'Your Portal'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <>
      {/* Vowlink Brand */}
      <div className="border-b border-[#D8B76A]/20 px-5 py-4">
        <div className="mb-4 flex items-center gap-2">
          <img src="/vowlink-icon.png" alt="" className="h-6 w-6 object-contain opacity-90" />
          <span className="font-serif text-lg tracking-wide text-white">Vowlink</span>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-2">Your Wedding</p>
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex items-center justify-center rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-3 py-1">
            <span className="text-xs font-medium text-[#D8B76A]">{initials}</span>
          </div>
          <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full ${
            user.tier === 'pro'
              ? 'bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13] shadow-[0_0_12px_rgba(250,204,21,0.3)] animate-pulse'
              : user.tier === 'plus'
              ? 'bg-[#7FA6D9] text-[#070A13]'
              : 'bg-white/10 text-white/60'
          }`}>
            {user.tier || 'free'}
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
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#D8B76A]/15 text-[#D8B76A]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Super Admin Switch — only visible to admins */}
      {user.role === 'admin' && (
        <div className="px-4 pb-2">
          <Link
            to="/super-admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all duration-200"
          >
            <span className="text-base">⚡</span>
            Super Admin Panel
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-[#D8B76A]/20 px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <span>⎋</span> Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070A13]">
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
          <header className="flex items-center justify-between border-b border-[#D8B76A]/20 bg-[#090D19] px-2 sm:px-4 py-3 lg:hidden shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col gap-1.5 p-1 text-white/60 hover:text-white transition"
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-6 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-6 rounded bg-current" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <img src="/vowlink-icon.png" alt="" className="h-5 w-5 object-contain opacity-80" />
              <span className="font-serif text-sm sm:text-base text-white">Vowlink</span>
              <span className={`text-[7px] sm:text-[8px] uppercase font-bold tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full ${
                user.tier === 'pro'
                  ? 'bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13]'
                  : user.tier === 'plus'
                  ? 'bg-[#7FA6D9] text-[#070A13]'
                  : 'bg-white/10 text-white/60'
              }`}>
                {user.tier || 'free'}
              </span>
            </div>
            <div className="flex items-center justify-center rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-1.5 sm:px-2 py-0.5">
              <span className="text-[10px] sm:text-xs font-medium text-[#D8B76A]">{initials}</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
