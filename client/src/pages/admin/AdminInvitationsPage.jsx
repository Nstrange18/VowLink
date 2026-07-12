import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import Skeleton from '../../components/common/Skeleton'
import { Icon } from '@iconify/react'
import QRCode from 'qrcode'
import { showConfirmToast } from '../../utils/toastConfirm'
import { buildPublicUrl } from '../../utils/siteUrl'

const AdminInvitationsPage = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [qrInvitation, setQrInvitation] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [downloadingQr, setDownloadingQr] = useState(false)
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
    const link = buildPublicUrl(`/invite/${slug}`)
    navigator.clipboard.writeText(link)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const getCheckInUrl = (invitation) => buildPublicUrl(`/check-in/${invitation.checkInToken}`)

  const createQrDataUrl = (url, width = 360) =>
    QRCode.toDataURL(url, {
      width,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#070A13',
        light: '#FFFFFF',
      },
    })

  useEffect(() => {
    let cancelled = false

    const renderQr = async () => {
      if (!qrInvitation?.checkInToken) {
        setQrDataUrl('')
        return
      }

      setQrLoading(true)
      try {
        const dataUrl = await createQrDataUrl(getCheckInUrl(qrInvitation), 360)
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        if (!cancelled) {
          setQrDataUrl('')
          toast.error('Unable to generate this QR code.')
        }
      } finally {
        if (!cancelled) setQrLoading(false)
      }
    }

    renderQr()

    return () => {
      cancelled = true
    }
  }, [qrInvitation])

  const handleDownloadQr = async () => {
    if (!qrInvitation) return
    const checkInUrl = getCheckInUrl(qrInvitation)
    const filename = `check-in-qr-${qrInvitation.slug || qrInvitation.guestName || 'guest'}.png`

    setDownloadingQr(true)
    try {
      const dataUrl = await createQrDataUrl(checkInUrl, 720)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Unable to download this QR code.')
    } finally {
      setDownloadingQr(false)
    }
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
      {qrInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1220] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">Check-In QR</p>
                <h3 className="mt-2 font-serif text-2xl">{qrInvitation.guestName}</h3>
                <p className="mt-1 text-xs text-white/45">{qrInvitation.category || 'Guest'} · {qrInvitation.allowedGuests || 1} guest{qrInvitation.allowedGuests === 1 ? '' : 's'}</p>
              </div>
              <button
                type="button"
                onClick={() => setQrInvitation(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white"
                aria-label="Close QR modal"
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-80 items-center justify-center rounded-3xl bg-white p-5">
              {qrLoading ? (
                <div className="flex flex-col items-center gap-3 text-[#070A13]/55">
                  <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Generating QR</p>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Check-in QR for ${qrInvitation.guestName}`}
                  className="mx-auto h-72 w-72 max-w-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-[#070A13]/55">
                  <Icon icon="lucide:triangle-alert" className="h-8 w-8" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">QR unavailable</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Check-in link</p>
              <p className="mt-1 break-all font-mono text-[11px] text-white/65">{getCheckInUrl(qrInvitation)}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getCheckInUrl(qrInvitation))
                  toast.success('Check-in link copied.')
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:bg-white/10"
              >
                <Icon icon="lucide:copy" className="h-3.5 w-3.5" />
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloadingQr || qrLoading || !qrInvitation.checkInToken}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon icon={downloadingQr ? "lucide:loader-2" : "lucide:download"} className={`h-3.5 w-3.5 ${downloadingQr ? 'animate-spin' : ''}`} />
                {downloadingQr ? 'Saving...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition duration-300 whitespace-nowrap ${tier === 'free'
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
          <Icon icon="lucide:palette" className="text-lg text-[#D8B76A]" />
          <p className="text-xs text-white/60">
            Want to customize card templates, colors, fonts, music, or couple photos? Customize everything on the{" "}
            <Link to="/admin/settings?tab=design" className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition">
              Settings page
            </Link>
            .
          </p>
        </div>
        <Link
          to="/admin/settings?tab=design"
          className="rounded-full bg-[#D8B76A]/10 border border-[#D8B76A]/30 px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] hover:bg-[#D8B76A]/20 transition shrink-0 text-center"
        >
          Go to Settings
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0D1220] border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        {/* Search Input */}
        <div className="relative">
          <Icon icon="lucide:search" className="absolute left-3.5 top-3.5 text-white/30 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-8 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-white/40 hover:text-white text-base"
            >
              <Icon icon="lucide:x" className="h-4 w-4" />
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
            <span className="inline-flex items-center gap-1">
              Create your first invitation <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
            </span>
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
                            <span className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${inv.senderGroup === 'bride'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : inv.senderGroup === 'groom'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                              {inv.senderGroup === 'bride' ? 'Bride' : inv.senderGroup === 'groom' ? 'Groom' : 'Both'}
                            </span>
                          )}
                          {inv.checkedIn && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                              <Icon icon="lucide:badge-check" className="h-3 w-3" />
                              Checked In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">/invite/{inv.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-white/60">{inv.category || 'Guest'}</td>
                      <td className="px-5 py-4 text-white/60">{inv.allowedGuests}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex min-w-23 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getRsvpBadgeClass(inv)}`}>
                          {getRsvpStatusText(inv)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopy(inv.slug)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#7FA6D9]/20 bg-[#7FA6D9]/10 text-[#7FA6D9] transition hover:border-[#7FA6D9]/50 hover:bg-[#7FA6D9]/15 hover:text-white"
                            title={copied === inv.slug ? "Copied" : "Copy invite link"}
                            aria-label={copied === inv.slug ? "Copied" : "Copy invite link"}
                          >
                            {copied === inv.slug ? (
                              <Icon icon="lucide:check" className="h-4 w-4" />
                            ) : (
                              <Icon icon="lucide:copy" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setQrInvitation(inv)}
                            disabled={!inv.checkInToken}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition hover:border-[#D8B76A]/50 hover:bg-[#D8B76A]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            title={inv.checkInToken ? "View check-in QR" : "Preparing QR token"}
                            aria-label={inv.checkInToken ? "View check-in QR" : "Preparing QR token"}
                          >
                            <Icon icon="lucide:qr-code" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const url = buildPublicUrl(`/invite/${inv.slug}`)
                              const msgBody = user.customShareMessage && user.customShareMessage.trim()
                                ? user.customShareMessage.trim()
                                : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                              const msg = encodeURIComponent(`Hello ${inv.guestName}! ${msgBody}\n${url}`)
                              const targetUrl = inv.phoneNumber
                                ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, '')}?text=${msg}`
                                : `https://wa.me/?text=${msg}`;
                              window.open(targetUrl, '_blank')
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/10 text-[#25D366] transition hover:border-[#25D366]/50 hover:bg-[#25D366]/15 hover:text-white"
                            title={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
                            aria-label={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
                          >
                            <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(inv)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                            title="Edit invitation"
                            aria-label="Edit invitation"
                          >
                            <Icon icon="lucide:pencil" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inv._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/15 bg-red-400/10 text-red-400/80 transition hover:border-red-400/40 hover:bg-red-400/15 hover:text-red-300"
                            title="Delete invitation"
                            aria-label="Delete invitation"
                          >
                            <Icon icon="lucide:trash-2" className="h-4 w-4" />
                          </button>
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
                          <span className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${inv.senderGroup === 'bride'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : inv.senderGroup === 'groom'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                            {inv.senderGroup === 'bride' ? 'Bride' : inv.senderGroup === 'groom' ? 'Groom' : 'Both'}
                          </span>
                        )}
                        {inv.checkedIn && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                            <Icon icon="lucide:badge-check" className="h-3 w-3" />
                            Checked In
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{inv.category || 'Guest'} · {inv.allowedGuests} guest{inv.allowedGuests !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`inline-flex min-w-22 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getRsvpBadgeClass(inv)}`}>
                      {getRsvpStatusText(inv)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mb-3">/invite/{inv.slug}</p>
                  <div className="flex items-center gap-2 border-t border-white/5 pt-3 flex-wrap">
                    <button
                      onClick={() => handleCopy(inv.slug)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#7FA6D9]/20 bg-[#7FA6D9]/10 text-[#7FA6D9] transition hover:text-white"
                      title={copied === inv.slug ? "Copied" : "Copy invite link"}
                      aria-label={copied === inv.slug ? "Copied" : "Copy invite link"}
                    >
                      {copied === inv.slug ? (
                        <Icon icon="lucide:check" className="h-4 w-4" />
                      ) : (
                        <Icon icon="lucide:copy" className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setQrInvitation(inv)}
                      disabled={!inv.checkInToken}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      title={inv.checkInToken ? "View check-in QR" : "Preparing QR token"}
                      aria-label={inv.checkInToken ? "View check-in QR" : "Preparing QR token"}
                    >
                      <Icon icon="lucide:qr-code" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = buildPublicUrl(`/invite/${inv.slug}`)
                        const msgBody = user.customShareMessage && user.customShareMessage.trim()
                          ? user.customShareMessage.trim()
                          : `We are so excited to celebrate our wedding with you. Please view your personal invitation and RSVP here:`;
                        const msg = encodeURIComponent(`Hello ${inv.guestName}! ${msgBody}\n${url}`)
                        const targetUrl = inv.phoneNumber
                          ? `https://wa.me/${inv.phoneNumber.trim().replace(/\+/g, '')}?text=${msg}`
                          : `https://wa.me/?text=${msg}`;
                        window.open(targetUrl, '_blank')
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/10 text-[#25D366] transition hover:text-white"
                      title={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
                      aria-label={inv.phoneNumber ? `Send direct RSVP reminder to WhatsApp (${inv.phoneNumber})` : "Share via WhatsApp"}
                    >
                      <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(inv)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:text-white"
                      title="Edit invitation"
                      aria-label="Edit invitation"
                    >
                      <Icon icon="lucide:pencil" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(inv._id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/15 bg-red-400/10 text-red-400/80 transition hover:text-red-300"
                      title="Delete invitation"
                      aria-label="Delete invitation"
                    >
                      <Icon icon="lucide:trash-2" className="h-4 w-4" />
                    </button>
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
