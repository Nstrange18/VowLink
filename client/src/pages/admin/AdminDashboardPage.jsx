import { useEffect, useState } from 'react'
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

const AdminDashboardPage = () => {
  const [invitations, setInvitations] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
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
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">Dashboard</h2>

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
