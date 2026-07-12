import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import Skeleton from '../../components/common/Skeleton'
import { Icon } from '@iconify/react'

const AdminRsvpsPage = () => {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [senderGroupFilter, setSenderGroupFilter] = useState('all')
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

  const senderGroupMeta = {
    bride: {
      label: 'Bride',
      className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
    groom: {
      label: 'Groom',
      className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    both: {
      label: 'Bride & Groom',
      className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    general: {
      label: 'General',
      className: 'bg-white/5 text-white/45 border border-white/10',
    },
  }

  const getSenderGroup = (rsvp) => rsvp.invitationId?.senderGroup || 'general'
  const getSenderGroupMeta = (rsvp) => senderGroupMeta[getSenderGroup(rsvp)] || senderGroupMeta.general
  const filteredRsvps = rsvps.filter((rsvp) => (
    senderGroupFilter === 'all' || getSenderGroup(rsvp) === senderGroupFilter
  ))

  const exportCSV = () => {
    if (tier !== 'pro') {
      toast.warning('Exporting RSVP list is a Pro feature! Upgrade to unlock.', { toastId: 'export-lock' });
      return;
    }
    const headers = ['Guest Name', 'Category', 'Invited By', 'Phone', 'Attending', 'No. of Guests', 'Meal Preference', 'Message', 'Date Submitted']
    const rows = filteredRsvps.map((r) => [
      r.guestName,
      r.invitationId?.category || 'Guest',
      getSenderGroupMeta(r).label,
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
                <span className="inline-flex items-center gap-1">
                  <Icon icon="lucide:alert-triangle" className="h-3 w-3" />
                  Limit reached! Upgrade your plan to accept more guest RSVPs.
                </span>
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
            <Icon icon="lucide:download" className="h-4 w-4" />
            Export CSV
            {tier !== 'pro' && <Icon icon="lucide:lock" className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {rsvps.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0D1220] p-4 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">Invited by</p>
              <p className="mt-1 text-xs text-white/45">
                Showing {filteredRsvps.length} of {rsvps.length} RSVP response{rsvps.length !== 1 ? 's' : ''}
              </p>
            </div>
            <select
              value={senderGroupFilter}
              onChange={(e) => setSenderGroupFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none transition focus:border-[#D8B76A]/60 sm:w-64"
            >
              <option value="all">Invited by: All</option>
              <option value="bride">Invited by: Bride</option>
              <option value="groom">Invited by: Groom</option>
              <option value="both">Invited by: Bride and Groom</option>
              <option value="general">Invited by: General</option>
            </select>
          </div>
        </div>
      )}

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
          {filteredRsvps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-white/40 text-sm">No RSVPs match this invited-by filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                      <th className="px-4 py-4">Guest</th>
                      <th className="px-4 py-4">Phone</th>
                      <th className="px-4 py-4">Attending</th>
                      <th className="px-4 py-4">Guests</th>
                      <th className="px-4 py-4 min-w-[150px]">Meal</th>
                      <th className="px-4 py-4">Message</th>
                      <th className="px-4 py-4">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRsvps.map((r, i) => {
                      const invitedBy = getSenderGroupMeta(r)
                      return (
                        <tr key={r._id}
                          className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? 'bg-[#0D1220]' : 'bg-transparent'}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-white">{r.guestName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-white/40">{r.invitationId?.category || 'Guest'}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${invitedBy.className}`}>
                                {invitedBy.label}
                              </span>
                            </div>
                          </td>
                    <td className="px-4 py-4 text-white/60">{r.phone}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.attending === 'Yes' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'}`}>
                        {r.attending}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/60">{r.numberOfGuests}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-3 py-1 text-xs text-[#D8B76A]/80">
                        {r.mealPreference || 'No Preference'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/50 max-w-[160px] truncate">{r.message || '—'}</td>
                    <td className="px-4 py-4 text-white/40 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filteredRsvps.map((r) => {
                  const invitedBy = getSenderGroupMeta(r)
                  return (
                    <div key={r._id} className="rounded-2xl border border-white/10 bg-[#0D1220] p-4">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div>
                          <p className="font-medium text-white">{r.guestName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-white/40">{r.invitationId?.category || 'Guest'}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${invitedBy.className}`}>
                              {invitedBy.label}
                            </span>
                          </div>
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
                  <span className="inline-flex max-w-full rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-3 py-1 text-xs text-[#D8B76A]/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon icon="mdi:silverware-fork-knife" className="h-3.5 w-3.5" />
                      {r.mealPreference || 'No Preference'}
                    </span>
                  </span>
                </div>
                {r.message && (
                  <p className="mt-3 text-xs text-white/40 border-t border-white/5 pt-3 italic">"{r.message}"</p>
                )}
                <p className="mt-2 text-xs text-white/20">
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default AdminRsvpsPage
