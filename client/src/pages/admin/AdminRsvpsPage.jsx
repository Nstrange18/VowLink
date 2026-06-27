import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import Skeleton from '../../components/common/Skeleton'

const AdminRsvpsPage = () => {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const tier = user.tier || 'free';
  const rsvpLimit = tier === 'free' ? 20 : tier === 'plus' ? 100 : 500;
  const percent = Math.min((rsvps.length / rsvpLimit) * 100, 100);

  useEffect(() => {
    api.get('/rsvps')
      .then((res) => setRsvps(res.data))
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    if (tier !== 'pro') {
      toast.warning('Exporting RSVP list is a Pro feature! Upgrade to unlock.', { toastId: 'export-lock' });
      return;
    }
    const headers = ['Guest Name', 'Category', 'Phone', 'Attending', 'No. of Guests', 'Meal Preference', 'Message', 'Date Submitted']
    const rows = rsvps.map((r) => [
      r.guestName,
      r.invitationId?.category || 'Guest',
      r.phone,
      r.attending,
      r.numberOfGuests,
      r.mealPreference || 'No Preference',
      r.message || '',
      new Date(r.createdAt).toLocaleDateString('en-GB'),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Responses</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-2">RSVPs</h2>
          
          {/* RSVP Limit Tracker */}
          <div className="mt-3 flex flex-col gap-1.5 w-72 sm:w-80">
            <div className="flex justify-between items-center text-[10px] text-white/50 uppercase tracking-wider">
              <span>RSVP Limit ({tier.toUpperCase()})</span>
              <span className="font-semibold text-white">{rsvps.length} / {rsvpLimit}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/10 relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  percent >= 100 
                    ? 'bg-linear-to-r from-red-500 to-rose-400' 
                    : percent >= 75 
                      ? 'bg-linear-to-r from-amber-500 to-yellow-400' 
                      : 'bg-linear-to-r from-[#D8B76A] to-[#F2D894]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {percent >= 100 && (
              <p className="text-[9px] text-red-400 mt-0.5 animate-pulse font-medium">
                ⚠️ Limit reached! Upgrade your plan to accept more guest RSVPs.
              </p>
            )}
          </div>
        </div>
        {rsvps.length > 0 && (
          <button
            onClick={exportCSV}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition whitespace-nowrap cursor-pointer ${
              tier === 'pro'
                ? 'border-[#D8B76A]/30 bg-[#D8B76A]/10 text-[#D8B76A] hover:bg-[#D8B76A]/20'
                : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            <span>⬇</span> Export CSV {tier !== 'pro' && '🔒'}
          </button>
        )}
      </div>

      {loading ? (
        <>
          {/* Skeleton Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0D1220]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="px-4 py-4">Guest</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Attending</th>
                  <th className="px-4 py-4">Guests</th>
                  <th className="px-4 py-4">Meal</th>
                  <th className="px-4 py-4">Message</th>
                  <th className="px-4 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-white/5 bg-[#0D1220]">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skeleton Mobile Cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/50 pt-2">
                  <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3.5 w-20" /></div>
                  <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3.5 w-8" /></div>
                </div>
                <div className="pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="border-t border-white/5 pt-3">
                  <Skeleton className="h-3.5 w-full" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </>
      ) : rsvps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/40 text-sm">No RSVPs received yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="px-4 py-4">Guest</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Attending</th>
                  <th className="px-4 py-4">Guests</th>
                  <th className="px-4 py-4">Meal</th>
                  <th className="px-4 py-4">Message</th>
                  <th className="px-4 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r, i) => (
                  <tr key={r._id}
                    className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? 'bg-[#0D1220]' : 'bg-transparent'}`}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{r.guestName}</p>
                      {r.invitationId?.category && (
                        <p className="text-xs text-white/40 mt-0.5">{r.invitationId.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white/60">{r.phone}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.attending === 'Yes' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'}`}>
                        {r.attending}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/60">{r.numberOfGuests}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-2.5 py-0.5 text-xs text-[#D8B76A]/80">
                        {r.mealPreference || 'No Preference'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/50 max-w-[160px] truncate">{r.message || '—'}</td>
                    <td className="px-4 py-4 text-white/40 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rsvps.map((r) => (
              <div key={r._id} className="rounded-2xl border border-white/10 bg-[#0D1220] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{r.guestName}</p>
                    {r.invitationId?.category && (
                      <p className="text-xs text-white/40 mt-0.5">{r.invitationId.category}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.attending === 'Yes' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'}`}>
                    {r.attending}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/50 mt-3">
                  <div><span className="text-white/30">Phone</span><br />{r.phone}</div>
                  <div><span className="text-white/30">Guests</span><br />{r.numberOfGuests}</div>
                </div>
                <div className="mt-2">
                  <span className="rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-2.5 py-0.5 text-xs text-[#D8B76A]/80">
                    🍽 {r.mealPreference || 'No Preference'}
                  </span>
                </div>
                {r.message && (
                  <p className="mt-3 text-xs text-white/40 border-t border-white/5 pt-3 italic">"{r.message}"</p>
                )}
                <p className="mt-2 text-xs text-white/20">
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminRsvpsPage
