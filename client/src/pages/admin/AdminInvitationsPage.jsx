import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import Skeleton from '../../components/common/Skeleton'
import { showConfirmToast } from '../../utils/toastConfirm'

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'))

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [senderGroupFilter, setSenderGroupFilter] = useState("all")

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
    const invitation = invitations.find((inv) => inv._id === id)
    showConfirmToast({
      toastId: `delete-invitation-${id}`,
      confirmLabel: 'Delete',
      message: `Delete ${invitation?.guestName || 'this invitation'}? This permanently removes the invitation and linked RSVP responses.`,
      onConfirm: async () => {
        try {
          await api.delete(`/invitations/${id}`)
          setInvitations((prev) => prev.filter((i) => i._id !== id))
          toast.success('Invitation deleted successfully.')
        } catch {
          toast.error('Failed to delete invitation.')
        }
      },
    })
  }


  const handleEdit = (invitation) => {
    navigate(`/admin/invitations/edit/${invitation._id}`, { state: { invitation } })
  }

  const tier = user.tier || 'free';
  const limit = tier === 'free' ? 1 : tier === 'plus' ? 100 : 500;
  const count = invitations.length;
  const progressPercent = Math.min((count / limit) * 100, 100);

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
    const matchesSenderGroup = senderGroupFilter === "all" || (inv.senderGroup || "general") === senderGroupFilter;
    
    const status = inv.hasRSVPed 
      ? "rsvped" 
      : isDeadlinePassed 
        ? "no_response" 
        : "pending";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesSenderGroup;
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
              {count} / {limit} invitations
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
            to={count >= limit ? "#" : "/admin/invitations/new"}
            id="new-invitation-btn"
            onClick={(e) => {
              if (count >= limit) {
                e.preventDefault();
                toast.warning(`You have reached the limit of ${limit} invitation${limit === 1 ? '' : 's'} for the ${tier.toUpperCase()} plan. Please upgrade your plan to create more!`, { toastId: 'limit-reached-new' });
                navigate('/admin/billing');
              }
            }}
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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0D1220] border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
          >
          </input>
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

        {/* Send Invite By Filter */}
        <div>
          <select
            value={senderGroupFilter}
            onChange={(e) => setSenderGroupFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-2.5 text-xs text-white/80 outline-none focus:border-[#D8B76A]/60 transition"
          >
            <option value="all">Send Invite By: All</option>
            <option value="bride">Send Invite By: Bride</option>
            <option value="groom">Send Invite By: Groom</option>
            <option value="both">Send Invite By: Both</option>
            <option value="general">Send Invite By: General</option>
          </select>
        </div>
      </div>

      {loading ? (
        <>
          {/* Skeleton Desktop Table */}
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-white/5 bg-[#0D1220]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3.5 w-10 rounded-full" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </td>
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-40" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            ))}
          </div>
        </>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{inv.guestName}</p>
                          {inv.senderGroup && inv.senderGroup !== 'general' && (
                            <span className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                              inv.senderGroup === 'bride' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : inv.senderGroup === 'groom' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {inv.senderGroup === 'bride' ? 'Bride' : inv.senderGroup === 'groom' ? 'Groom' : 'Both'}
                            </span>
                          )}
                        </div>
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
                              const msgBody = user.customShareMessage && user.customShareMessage.trim()
                                ? user.customShareMessage.trim()
                                : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                              const msg = encodeURIComponent(`Hello ${inv.guestName}! ${msgBody}\n${url}`)
                              const targetUrl = inv.phoneNumber 
                                ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, '')}?text=${msg}`
                                : `https://wa.me/?text=${msg}`;
                              window.open(targetUrl, '_blank')
                            }}
                            className="text-xs text-[#25D366] hover:text-white transition font-medium"
                            title={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{inv.guestName}</p>
                        {inv.senderGroup && inv.senderGroup !== 'general' && (
                          <span className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${
                            inv.senderGroup === 'bride' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : inv.senderGroup === 'groom' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.senderGroup === 'bride' ? 'Bride' : inv.senderGroup === 'groom' ? 'Groom' : 'Both'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{inv.category || 'Guest'} · {inv.allowedGuests} guest{inv.allowedGuests !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRsvpBadgeClass(inv)}`}>
                      {getRsvpStatusText(inv)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mb-3">/invite/{inv.slug}</p>
                  <div className="flex items-center gap-4 border-t border-white/5 pt-3 flex-wrap">
                    <button onClick={() => handleCopy(inv.slug)} className="text-xs text-[#7FA6D9] hover:text-white transition">
                      {copied === inv.slug ? '✓ Copied' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/invite/${inv.slug}`
                        const msgBody = user.customShareMessage && user.customShareMessage.trim()
                          ? user.customShareMessage.trim()
                          : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                        const msg = encodeURIComponent(`Hello ${inv.guestName}! ${msgBody}\n${url}`)
                        const targetUrl = inv.phoneNumber 
                          ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, '')}?text=${msg}`
                          : `https://wa.me/?text=${msg}`;
                        window.open(targetUrl, '_blank')
                      }}
                      className="text-xs text-[#25D366] hover:text-white transition font-medium"
                      title={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
                    >
                      📲 WhatsApp
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

    </div>
  )
}

export default AdminInvitationsPage;
