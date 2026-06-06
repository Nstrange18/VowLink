import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const CATEGORIES = ['VIP', 'Family', 'Friend', 'Colleague', 'Guest']

const categoryColors = {
  VIP: { ring: 'border-[#D8B76A]/40', bg: 'bg-[#D8B76A]/10', text: 'text-[#D8B76A]', dot: 'bg-[#D8B76A]' },
  Family: { ring: 'border-[#7FA6D9]/40', bg: 'bg-[#7FA6D9]/10', text: 'text-[#7FA6D9]', dot: 'bg-[#7FA6D9]' },
  Friend: { ring: 'border-emerald-400/40', bg: 'bg-emerald-400/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Colleague: { ring: 'border-purple-400/40', bg: 'bg-purple-400/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  Guest: { ring: 'border-white/20', bg: 'bg-white/5', text: 'text-white/60', dot: 'bg-white/40' },
}

const StatCard = ({ label, value, color, sub }) => (
  <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-6">
    <p className="text-xs uppercase tracking-widest text-white/40 mb-2">{label}</p>
    <p className={`font-serif text-5xl font-light ${color}`}>{value}</p>
    {sub && <p className="mt-2 text-xs text-white/30">{sub}</p>}
  </div>
)

// ── Wedding Countdown Widget ──────────────────────────────────────────────────
const CountdownWidget = ({ weddingDate }) => {
  const [daysLeft, setDaysLeft] = useState(null)

  useEffect(() => {
    if (!weddingDate) return
    const update = () => {
      const now = new Date()
      const target = new Date(weddingDate)
      target.setHours(0, 0, 0, 0)
      now.setHours(0, 0, 0, 0)
      const diff = Math.round((target - now) / (1000 * 60 * 60 * 24))
      setDaysLeft(diff)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [weddingDate])

  if (!weddingDate) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D8B76A]/20 bg-[#D8B76A]/5 px-6 py-8 text-center">
        <p className="text-3xl mb-3">💍</p>
        <p className="text-white/60 text-sm mb-3">Your wedding date isn't set yet.</p>
        <Link
          to="/admin/settings"
          className="inline-block rounded-full bg-[#D8B76A]/20 border border-[#D8B76A]/30 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#D8B76A] hover:bg-[#D8B76A]/30 transition"
        >
          Set Your Date →
        </Link>
      </div>
    )
  }

  if (daysLeft === null) return null

  const formattedDate = new Date(weddingDate).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (daysLeft < 0) {
    return (
      <div className="rounded-2xl border border-[#D8B76A]/30 bg-gradient-to-br from-[#D8B76A]/15 to-[#D8B76A]/5 px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle at 50% 0%, #D8B76A, transparent 70%)' }} />
        <p className="text-4xl mb-3">🎊</p>
        <h3 className="font-serif text-2xl text-white mb-1">You're Married!</h3>
        <p className="text-white/50 text-sm">Congratulations on your special day — {formattedDate}</p>
      </div>
    )
  }

  if (daysLeft === 0) {
    return (
      <div className="rounded-2xl border border-[#D8B76A]/30 bg-gradient-to-br from-[#D8B76A]/15 to-[#D8B76A]/5 px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle at 50% 0%, #D8B76A, transparent 70%)' }} />
        <p className="text-4xl mb-3 animate-bounce">🎉</p>
        <h3 className="font-serif text-3xl text-[#D8B76A] mb-1">Today's the Day!</h3>
        <p className="text-white/60 text-sm">{formattedDate}</p>
      </div>
    )
  }

  const weeks = Math.floor(daysLeft / 7)
  const months = Math.floor(daysLeft / 30)

  return (
    <div className="rounded-2xl border border-[#D8B76A]/25 bg-gradient-to-br from-[#0D1220] to-[#111827] px-6 py-7 relative overflow-hidden">
      {/* Gold glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D8B76A]/40 to-transparent" />
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-8 blur-2xl" style={{ background: '#D8B76A' }} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A]/70 mb-1">Wedding Countdown</p>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-7xl font-light text-white leading-none">{daysLeft}</span>
            <span className="text-white/40 text-lg">days to go</span>
          </div>
          <p className="mt-2 text-xs text-white/40">{formattedDate}</p>
        </div>

        {/* Sub-metrics */}
        <div className="flex gap-4 sm:flex-col sm:gap-2 sm:items-end">
          {months > 0 && (
            <div className="text-right">
              <p className="text-[#D8B76A] font-serif text-2xl font-light">{months}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/30">months</p>
            </div>
          )}
          {weeks > 0 && (
            <div className="text-right">
              <p className="text-[#7FA6D9] font-serif text-2xl font-light">{weeks}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/30">weeks</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar towards the big day */}
      {daysLeft <= 365 && (
        <div className="mt-5 relative z-10">
          <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
            <span>Today</span>
            <span>{Math.round(((365 - daysLeft) / 365) * 100)}% of the year gone</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D8B76A] to-[#F2D894] rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(((365 - daysLeft) / 365) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}


const AdminDashboardPage = () => {
  const [invitations, setInvitations] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [weddingDate, setWeddingDate] = useState(null)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (storedUser?.weddingDate) setWeddingDate(storedUser.weddingDate)
    const load = async () => {
      try {
        const [invRes, rsvpRes] = await Promise.all([
          api.get('/invitations'),
          api.get('/rsvps'),
        ])
        setInvitations(invRes.data)
        setRsvps(rsvpRes.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-white/40">Loading stats...</div>
  if (error) return <div className="p-8 text-red-400">Could not load data. Is the server running?</div>

  const attending = rsvps.filter((r) => r.attending === 'Yes').length
  const notAttending = rsvps.filter((r) => r.attending === 'No').length
  const pending = invitations.filter((i) => !i.hasRSVPed).length

  // Group invitations by category
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const guests = invitations.filter((i) => (i.category || 'Guest') === cat)
    if (guests.length > 0) acc[cat] = guests
    return acc
  }, {})

  // Categories with any invitations
  const activeCategories = Object.entries(byCategory)

  return (
    <div className="p-4 sm:p-8 space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Overview</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">Dashboard</h2>

        {/* Customization Tip Banner */}
        <div className="mb-6 rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-5 py-4 flex items-start gap-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] animate-fade-in">
          <span className="text-xl mt-0.5">🎨</span>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8B76A]">Personalize Your Invitation</h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Want to customize your card design, change theme templates, upload a couple photo overlay, pick background music, or fine-tune fonts? Head over to the <Link to="/admin/settings" className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition">Settings Page</Link> to customize your VowLink experience!
            </p>
          </div>
        </div>

        {/* Wedding Countdown */}
        <div className="mb-6">
          <CountdownWidget weddingDate={weddingDate} />
        </div>

        {/* Stats row */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Invitations" value={invitations.length} color="text-white" />
          <StatCard label="RSVPs" value={rsvps.length} color="text-[#7FA6D9]" />
          <StatCard label="Attending" value={attending} color="text-emerald-400" />
          <StatCard label="Not Attending" value={notAttending} color="text-red-400" />
          <StatCard label="Pending" value={pending} color="text-[#D8B76A]" sub="awaiting response" />
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Breakdown</p>
        <h3 className="font-serif text-2xl text-white mb-6">Guests by Category</h3>

        {activeCategories.length === 0 ? (
          <p className="text-white/30 text-sm">No invitations yet. Create your first one!</p>
        ) : (
          <div className="space-y-4">
            {activeCategories.map(([category, guests]) => {
              const colors = categoryColors[category] || categoryColors.Guest
              const rsvpedCount = guests.filter((g) => g.hasRSVPed).length
              const pct = guests.length > 0 ? Math.round((rsvpedCount / guests.length) * 100) : 0

              return (
                <div
                  key={category}
                  className={`rounded-2xl border ${colors.ring} ${colors.bg} px-4 sm:px-6 py-4 sm:py-5`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                      <span className={`text-sm font-semibold uppercase tracking-widest ${colors.text}`}>
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 text-xs text-white/50 flex-wrap">
                      <span><span className="text-white font-medium">{guests.length}</span> invited</span>
                      <span><span className="text-white font-medium">{rsvpedCount}</span> RSVPed</span>
                      <span><span className={`font-medium ${colors.text}`}>{pct}%</span> rate</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.dot} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Guest chips */}
                  <div className="flex flex-wrap gap-2">
                    {guests.map((g) => (
                      <span
                        key={g._id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                          g.hasRSVPed
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                            : 'border-white/10 bg-white/5 text-white/50'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${g.hasRSVPed ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        {g.guestName}
                        {g.hasRSVPed && <span className="ml-0.5">✓</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
