import { useEffect, useState } from 'react'
import api from '../../utils/api'

const AdminRsvpsPage = () => {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rsvps')
      .then((res) => setRsvps(res.data))
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
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
          <h2 className="font-serif text-3xl sm:text-4xl text-white">RSVPs</h2>
        </div>
        {rsvps.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-full border border-[#D8B76A]/30 bg-[#D8B76A]/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] transition hover:bg-[#D8B76A]/20 whitespace-nowrap"
          >
            <span>⬇</span> Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-white/40">Loading responses...</p>
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
