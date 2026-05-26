import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/invitations')
      setInvitations(res.data)
    } catch {
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvitations() }, [])

  const handleCopy = (slug) => {
    const link = `${window.location.origin}/invite/${slug}`
    navigator.clipboard.writeText(link)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invitation?')) return
    try {
      await api.delete(`/invitations/${id}`)
      setInvitations((prev) => prev.filter((i) => i._id !== id))
    } catch {
      alert('Failed to delete invitation.')
    }
  }

  const handleEdit = (invitation) => {
    navigate(`/admin/invitations/edit/${invitation._id}`, { state: { invitation } })
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Manage</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Invitations</h2>
        </div>
        <Link
          to="/admin/invitations/new"
          id="new-invitation-btn"
          className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] whitespace-nowrap"
        >
          + New Invitation
        </Link>
      </div>

      {loading ? (
        <p className="text-white/40">Loading invitations...</p>
      ) : invitations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/40 text-sm">No invitations yet.</p>
          <Link to="/admin/invitations/new" className="mt-3 inline-block text-[#D8B76A] text-sm hover:underline">
            Create your first invitation →
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Guests</th>
                  <th className="px-5 py-4">RSVP</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv, i) => (
                  <tr
                    key={inv._id}
                    className={`border-b border-white/5 transition hover:bg-white/3 ${i % 2 === 0 ? 'bg-[#0D1220]' : 'bg-transparent'}`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{inv.guestName}</p>
                      <p className="text-xs text-white/40 mt-0.5">/invite/{inv.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-white/60">{inv.category || 'Guest'}</td>
                    <td className="px-5 py-4 text-white/60">{inv.allowedGuests}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${inv.hasRSVPed ? 'bg-emerald-400/15 text-emerald-400' : 'bg-[#D8B76A]/15 text-[#D8B76A]'}`}>
                        {inv.hasRSVPed ? 'RSVPed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => handleCopy(inv.slug)} className="text-xs text-[#7FA6D9] hover:text-white transition">
                          {copied === inv.slug ? '✓ Copied' : 'Copy Link'}
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/invite/${inv.slug}`
                            const msg = encodeURIComponent(`You're invited! Open your personal invitation here:\n${url}`)
                            window.open(`https://wa.me/?text=${msg}`, '_blank')
                          }}
                          className="text-xs text-[#25D366] hover:text-white transition"
                          title="Share via WhatsApp"
                        >
                          📲 WhatsApp
                        </button>
                        <button onClick={() => handleEdit(inv)} className="text-xs text-white/50 hover:text-white transition">Edit</button>
                        <button onClick={() => handleDelete(inv._id)} className="text-xs text-red-400/70 hover:text-red-400 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {invitations.map((inv) => (
              <div key={inv._id} className="rounded-2xl border border-white/10 bg-[#0D1220] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-white">{inv.guestName}</p>
                    <p className="text-xs text-white/40 mt-0.5">{inv.category || 'Guest'} · {inv.allowedGuests} guest{inv.allowedGuests !== 1 ? 's' : ''}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${inv.hasRSVPed ? 'bg-emerald-400/15 text-emerald-400' : 'bg-[#D8B76A]/15 text-[#D8B76A]'}`}>
                    {inv.hasRSVPed ? 'RSVPed' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-white/30 mb-3">/invite/{inv.slug}</p>
                <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                  <button onClick={() => handleCopy(inv.slug)} className="text-xs text-[#7FA6D9] hover:text-white transition">
                    {copied === inv.slug ? '✓ Copied' : 'Copy Link'}
                  </button>
                  <button onClick={() => handleEdit(inv)} className="text-xs text-white/50 hover:text-white transition">Edit</button>
                  <button onClick={() => handleDelete(inv._id)} className="text-xs text-red-400/70 hover:text-red-400 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminInvitationsPage
