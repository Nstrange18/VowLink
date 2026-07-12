import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Icon } from '@iconify/react'

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
  { to: '/admin/invitations', label: 'Invitations', icon: 'lucide:mail' },
  { to: '/admin/whatsapp-bulk', label: 'WhatsApp Sender', icon: 'lucide:message-square' },
  { to: '/admin/rsvps', label: 'RSVPs', icon: 'lucide:check-square' },
  { to: '/admin/seating', label: 'Seating Chart', icon: 'lucide:grid' },
  { to: '/admin/venues', label: 'Suggested Venues', icon: 'lucide:map-pin' },
  { to: '/admin/venue-inquiries', label: 'Venue Requests', icon: 'lucide:inbox' },
  { to: '/admin/billing', label: 'Billing & Tiers', icon: 'lucide:credit-card' },
  { to: '/admin/settings', label: 'Settings', icon: 'lucide:settings' },
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
      <div className="border-b border-[#D8B76A]/20 px-5 py-4 shrink-0">
        <div className="mb-4 flex items-center gap-2">
          <img src="/vowlink-icon.webp" alt="" className="h-6 w-6 object-contain opacity-90" />
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
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
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
            <span className="text-base flex items-center justify-center">
              <Icon icon={icon} className="w-4 h-4 shrink-0" />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Footer actions (pinned at bottom, with border separator and mt-auto gap) */}
      <div className="mt-auto border-t border-[#D8B76A]/20 pt-4 bg-[#090D19] shrink-0">
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
              <img src="/vowlink-icon.webp" alt="" className="h-5 w-5 object-contain opacity-80" />
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

          <main className="flex-1 overflow-y-auto overflow-x-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
