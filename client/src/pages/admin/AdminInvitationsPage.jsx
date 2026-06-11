import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../utils/api'

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

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

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await api.delete(`/invitations/${deleteTargetId}`)
      setInvitations((prev) => prev.filter((i) => i._id !== deleteTargetId))
      toast.success('Invitation deleted successfully. ✓')
    } catch {
      toast.error('Failed to delete invitation.')
    } finally {
      setDeleteTargetId(null)
    }
  }

  const handleEdit = (invitation) => {
    navigate(`/admin/invitations/edit/${invitation._id}`, { state: { invitation } })
  }

  const tier = user.tier || 'free';
  const limit = tier === 'free' ? 10 : tier === 'plus' ? 100 : Infinity;
  const count = invitations.length;
  const progressPercent = limit === Infinity ? 0 : Math.min((count / limit) * 100, 100);

  // Dynamic unique categories from invitations
  const categories = ["all", ...new Set(invitations.map(inv => inv.category || "Guest").filter(Boolean))];

  // Check if wedding RSVP deadline has passed
  const isDeadlinePassed = user.rsvpDeadline && new Date() > new Date(user.rsvpDeadline);

  const getRsvpBadgeClass = (inv) => {
    if (inv.hasRSVPed) return 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/10';
    if (isDeadlinePassed) return 'bg-rose-500/15 text-rose-400 border border-rose-500/10';
    return 'bg-[#D8B76A]/15 text-[#D8B76A] border border-[#D8B76A]/10';
  };

  const getRsvpStatusText = (inv) => {
    if (inv.hasRSVPed) return 'RSVPed';
    if (isDeadlinePassed) return 'No Response';
    return 'Pending';
  };

  // Filter & Search Logic
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch = inv.guestName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || (inv.category || "Guest") === categoryFilter;
    
    const status = inv.hasRSVPed 
      ? "rsvped" 
      : isDeadlinePassed 
        ? "no_response" 
        : "pending";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Manage</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Invitations</h2>
          {/* Progress meter */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#D8B76A] transition-all duration-300"
                style={{ width: `${limit === Infinity ? 0 : progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              {count} / {limit === Infinity ? '∞' : limit} invitations
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/invitations/bulk"
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition duration-300 whitespace-nowrap ${
              tier === 'free'
                ? 'bg-white/5 border border-dashed border-white/15 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
            onClick={(e) => {
              if (tier === 'free') {
                e.preventDefault();
                toast.info('Bulk creation is a Plus and Pro plan feature! Upgrade to unlock.');
                navigate('/admin/billing');
              }
            }}
          >
            + Bulk Import
          </Link>
          <Link
            to="/admin/invitations/new"
            id="new-invitation-btn"
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] whitespace-nowrap"
          >
            + New Invitation
          </Link>
        </div>
      </div>

      {/* Settings customization note */}
      <div className="mb-6 rounded-2xl border border-white/5 bg-white/3 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎨</span>
          <p className="text-xs text-white/60">
            Want to customize card templates, colors, fonts, music, or couple photos? Customize everything on the{" "}
            <Link to="/admin/settings" className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition">
              Settings page
            </Link>
            .
          </p>
        </div>
        <Link
          to="/admin/settings"
          className="rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] hover:bg-[#D8B76A]/20 transition shrink-0 text-center"
        >
          Go to Settings
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0D1220] border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-white/40 hover:text-white text-base"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition"
          >
            <option value="all">Status: All RSVPs</option>
            <option value="pending">Status: Pending</option>
            <option value="rsvped">Status: RSVPed</option>
            <option value="no_response">Status: No Response (Deadline Passed)</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition capitalize"
          >
            <option value="all">Category: All Categories</option>
            {categories.filter(cat => cat !== "all").map(cat => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>
        </div>
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
          <div className="mb-4 flex items-center justify-between text-xs text-white/40 px-1">
            <span>
              Showing {filteredInvitations.length} of {count} guests
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0D1220]/40">
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
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-white/30 text-xs">
                      No invitations match the active filters or search query.
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv, i) => (
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
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRsvpBadgeClass(inv)}`}>
                          {getRsvpStatusText(inv)}
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
                          <button onClick={() => handleDeleteClick(inv._id)} className="text-xs text-red-400/70 hover:text-red-400 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filteredInvitations.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-xs bg-[#0D1220] rounded-2xl border border-white/10">
                No invitations match the active filters or search query.
              </div>
            ) : (
              filteredInvitations.map((inv) => (
                <div key={inv._id} className="rounded-2xl border border-white/10 bg-[#0D1220] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">{inv.guestName}</p>
                      <p className="text-xs text-white/40 mt-0.5">{inv.category || 'Guest'} · {inv.allowedGuests} guest{inv.allowedGuests !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRsvpBadgeClass(inv)}`}>
                      {getRsvpStatusText(inv)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mb-3">/invite/{inv.slug}</p>
                  <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                    <button onClick={() => handleCopy(inv.slug)} className="text-xs text-[#7FA6D9] hover:text-white transition">
                      {copied === inv.slug ? '✓ Copied' : 'Copy Link'}
                    </button>
                    <button onClick={() => handleEdit(inv)} className="text-xs text-white/50 hover:text-white transition">Edit</button>
                    <button onClick={() => handleDeleteClick(inv._id)} className="text-xs text-red-400/70 hover:text-red-400 transition">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1220] p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Invitation?</h3>
                <p className="text-white/60 text-xs">This action cannot be undone. All guest responses and RSVPs for this link will be permanently lost.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInvitationsPage;
