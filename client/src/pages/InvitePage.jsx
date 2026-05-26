import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { toPng } from 'html-to-image'
import api from '../utils/api'
import { rsvpSchema } from '../utils/schemas'

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

const CountdownBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="rounded-xl border border-[#D8B76A]/30 bg-[#D8B76A]/10 px-3 py-2 min-w-13 text-center">
      <span className="font-serif text-2xl font-light text-white">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="mt-1 text-[9px] uppercase tracking-widest text-[#D8B76A]/70">{label}</span>
  </div>
)

const MEAL_OPTIONS = ['No Preference', 'Chicken', 'Fish', 'Vegetarian', 'Vegan']

const InvitePage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const countdown = useCountdown(invitation?.userId?.weddingDate)
  const rsvpDeadline = invitation?.userId?.rsvpDeadline
  const deadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName: '', phone: '', attending: 'Yes',
      numberOfGuests: 1, mealPreference: 'No Preference', message: '',
    },
  })


  useEffect(() => {
    api.get(`/invitations/slug/${slug}`)
      .then((res) => {
        setInvitation(res.data)
        setValue('guestName', res.data.guestName)
      })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug, setValue])


  const onRsvpSubmit = async (data) => {
    try {
      await api.post('/rsvps', {
        invitationId: invitation._id,
        guestName: data.guestName,
        phone: data.phone,
        attending: data.attending,
        numberOfGuests: Number(data.numberOfGuests),
        mealPreference: data.mealPreference,
        message: data.message,
      })
      navigate('/rsvp-success', {
        state: {
          partner1Name: invitation.userId?.partner1Name,
          partner2Name: invitation.userId?.partner2Name,
          weddingDate: invitation.userId?.weddingDate,
        },
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit RSVP. Please try again.')
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `invitation-${invitation.guestName?.toLowerCase().replace(/\s+/g, '-') || 'card'}.png`
      link.href = dataUrl
      link.click()
    } catch (e) { console.error('Download failed', e) }
    finally { setDownloading(false) }
  }

  const handleWhatsAppShare = () => {
    const inviteUrl = `${window.location.origin}/invite/${slug}`
    const p1 = invitation?.userId?.partner1Name || ''
    const p2 = invitation?.userId?.partner2Name || ''
    const msg = encodeURIComponent(
      `You're cordially invited to the wedding of ${p1} & ${p2}! 🎉\n\nOpen your personal invitation here:\n${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13]">
      <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">Loading your invitation...</p>
    </section>
  )

  if (notFound) return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] text-center px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">Not Found</p>
        <h1 className="font-serif text-5xl text-white mb-4">Invitation Not Found</h1>
        <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />
        <p className="text-white/60">Please check the link you received.</p>
      </div>
    </section>
  )

  const inputClass = "w-full rounded-xl border border-[#1A2E4A]/15 bg-white px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition"
  const venue = invitation.userId?.venue
  const weddingDate = invitation.userId?.weddingDate
  const script = { fontFamily: "'Dancing Script', cursive" }
  const serif  = { fontFamily: "'Cormorant Garamond', serif" }
  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null
  const mapsUrl = venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
    : null

  return (
    <div className="min-h-screen bg-[#07101f]">

      {/* ── INVITATION CARD SECTION ── */}
      <section className="flex flex-col items-center justify-center py-10 px-4 gap-6 bg-[#07101f]">

        {/* ═══ THE CARD (this gets downloaded) ═══ */}
        <div
          ref={cardRef}
          className="w-full max-w-90 sm:max-w-100 rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        >
          {/* hero-bg2.png IS the card background */}
          <div
            className="relative bg-[url('/hero-bg2.png')] bg-cover bg-center w-full"
            style={{ minHeight: 620 }}
          >
            {/* Text sits in the cream centre — padding keeps it away from corner flowers */}
            <div className="px-10 pt-14 pb-16 flex flex-col items-center text-center">

              {/* ── Wedding Invitation title ── */}
              <h2 style={{ ...script, fontSize: '2rem', lineHeight: 1.25, color: '#1A2E4A' }} className="mt-3">
                Wedding Invitation
              </h2>

              {/* gold divider */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px w-12" style={{ background: '#B8963A', opacity: 0.6 }} />
                <span style={{ color: '#B8963A', fontSize: '0.65rem' }}>❧</span>
                <div className="h-px w-12" style={{ background: '#B8963A', opacity: 0.6 }} />
              </div>

              {/* ── Marriage between ── */}
              <p style={{ ...script, fontSize: '1.35rem', fontStyle: 'italic', color: '#1A2E4A' }} className="mb-1">
                Marriage between
              </p>

              {/* ── Couple names ── */}
              <h1 style={{ ...script, fontSize: '2.6rem', lineHeight: 1.1, color: '#1A2E4A' }} className="mb-1">
                {invitation.userId?.partner1Name || 'Partner 1'}{' '}
                <span style={{ color: '#B8963A' }}>and</span>{' '}
                {invitation.userId?.partner2Name || 'Partner 2'}
              </h1>

              {/* ornament */}
              <div className="flex items-center gap-2 my-4">
                <div className="h-px w-10" style={{ background: '#B8963A', opacity: 0.6 }} />
                <span style={{ color: '#B8963A', fontSize: '0.6rem' }}>✦</span>
                <div className="h-px w-10" style={{ background: '#B8963A', opacity: 0.6 }} />
              </div>

              {/* ── You are cordially invited ── */}
              <p style={{ ...serif, fontSize: '1.05rem', color: '#1A2E4A' }} className="mb-4">
                You are cordially invited
              </p>

              {/* ── Dear [guestName] ── */}
              <p style={{ ...script, fontSize: '1.6rem', fontStyle: 'italic', color: '#1A2E4A' }} className="mb-3">
                Dear {invitation.guestName},
              </p>

              {/* ── Custom message ── */}
              <p style={{ ...serif, fontSize: '1rem', lineHeight: 1.8, color: '#1A2E4A' }} className="mb-5 max-w-60">
                {invitation.customMessage}
              </p>

              {/* ── Date ── */}
              {formattedDate && (
                <p style={{ ...serif, fontSize: '0.95rem', color: '#1A2E4A' }} className="mb-2">
                  Date : {formattedDate}
                </p>
              )}

              {/* ── Venue (clickable → Google Maps) ── */}
              {venue && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...serif, fontSize: '0.95rem', color: '#1A2E4A', textDecoration: 'underline', textDecorationColor: '#B8963A55', textUnderlineOffset: '3px' }}
                  className="mb-5 hover:text-[#B8963A] transition text-center block max-w-55"
                >
                  Location: {venue}
                </a>
              )}

              {/* bottom ornament */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8" style={{ background: '#B8963A', opacity: 0.6 }} />
                <span style={{ color: '#B8963A', fontSize: '0.6rem' }}>◆</span>
                <div className="h-px w-8" style={{ background: '#B8963A', opacity: 0.6 }} />
              </div>

              {/* ── Category badge (VIP ACCESS style) ── */}
              <p style={{ ...serif, fontSize: '1.25rem', letterSpacing: '0.18em', color: '#1A2E4A', fontWeight: 700 }} className="uppercase">
                {invitation.category || 'Guest'}
              </p>

            </div>
          </div>
        </div>
        {/* ═══ END CARD ═══ */}

        {/* ── Countdown (outside card, not downloaded) ── */}
        {countdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
          <div className="w-full max-w-90 sm:max-w-100">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-[#D8B76A] mb-3">Counting Down</p>
            <div className="flex items-end justify-center gap-2">
              <CountdownBox value={countdown.days} label="Days" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.hours} label="Hours" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.minutes} label="Mins" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.seconds} label="Secs" />
            </div>
          </div>
        )}

        {/* ── RSVP Deadline badge ── */}
        {rsvpDeadline && (
          <div className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 ${
            deadlinePassed
              ? 'border-red-400/30 bg-red-400/10 text-red-400'
              : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
          }`}>
            <span>{deadlinePassed ? '🔒' : '⏰'}</span>
            <p className="text-xs font-medium">
              {deadlinePassed
                ? 'RSVP is now closed'
                : `RSVP by ${new Date(rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        )}

        {/* ── RSVP Status / Button ── */}
        {invitation.hasRSVPed ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-8 py-4">
            <p className="text-sm text-emerald-400">✓ We've received your RSVP. Thank you!</p>
          </div>
        ) : deadlinePassed ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-8 py-4">
            <p className="text-sm text-red-400">🔒 RSVP is now closed.</p>
          </div>
        ) : (
          <button
            id="rsvp-open-btn"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.45)]"
          >
            ✦ RSVP Now
          </button>
        )}

        {/* ── Download & Share ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-full border border-[#D8B76A]/40 bg-[#1A2E4A]/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] backdrop-blur-sm transition hover:bg-[#1A2E4A] hover:shadow-[0_8px_24px_rgba(216,183,106,0.2)] disabled:opacity-50"
          >
            {downloading ? <span className="animate-pulse">Downloading…</span> : <><span>⬇</span> Download</>}
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#25D366] backdrop-blur-sm transition hover:bg-[#25D366]/25"
          >
            <span>📲</span> Share
          </button>
        </div>

      </section>

      {/* WEDDING DETAILS SECTION */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 text-center bg-[#070A13]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">The Details</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 sm:mb-10">Wedding Day</h2>
        <div className="mx-auto max-w-3xl grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: '◈', label: 'Date',
              value: weddingDate
                ? new Date(weddingDate).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })
                : 'To be announced',
            },
            { icon: '📍', label: 'Venue', value: venue || 'To be announced' },
            { icon: '◉', label: 'Dress Code', value: 'White\nChampagne Gold\nNavy Blue' },
            { icon: '✦', label: 'Your Category', value: invitation.category || 'Guest' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
              <span className="text-2xl text-[#D8B76A]">{icon}</span>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">{label}</p>
              <p className="text-white text-sm leading-6 whitespace-pre-line">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RSVP MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D8B76A]/20 bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#1A2E4A]">Your RSVP</h2>
              <button onClick={() => setShowForm(false)} className="text-[#1A2E4A]/40 hover:text-[#1A2E4A] transition text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit(onRsvpSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Name *</label>
                <input id="rsvp-name" {...register('guestName')}
                  className={`${inputClass} ${errors.guestName ? 'border-red-400/50' : ''}`} />
                {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Phone Number *</label>
                <input id="rsvp-phone" placeholder="+234 800 000 0000" {...register('phone')}
                  className={`${inputClass} ${errors.phone ? 'border-red-400/50' : ''}`} />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              {/* Attending toggle */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Will you attend? *</label>
                <Controller
                  name="attending"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-3">
                      {['Yes', 'No'].map((opt) => (
                        <button key={opt} type="button" onClick={() => field.onChange(opt)}
                          className={`flex-1 rounded-xl border py-3 text-sm font-medium transition ${
                            field.value === opt
                              ? opt === 'Yes' ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700' : 'border-red-400/50 bg-red-50 text-red-600'
                              : 'border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20'
                          }`}>
                          {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Number of guests */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Number of Guests (max {invitation.allowedGuests})
                </label>
                <input id="rsvp-guests" type="number" min={1} max={invitation.allowedGuests}
                  {...register('numberOfGuests')} className={inputClass} />
                {errors.numberOfGuests && <p className="mt-1 text-xs text-red-500">{errors.numberOfGuests.message}</p>}
              </div>

              {/* Meal preference */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Meal Preference</label>
                <Controller
                  name="mealPreference"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {MEAL_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => field.onChange(opt)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                            field.value === opt
                              ? 'border-[#B8963A]/60 bg-[#D8B76A]/15 text-[#B8963A]'
                              : 'border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Message (optional)</label>
                <textarea id="rsvp-message" rows={3} placeholder="A note for the couple..."
                  {...register('message')} className={`${inputClass} resize-none`} />
              </div>

              <button type="submit" id="rsvp-submit-btn" disabled={isSubmitting}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.4)] disabled:opacity-60 mt-2">
                {isSubmitting ? 'Sending...' : 'Submit RSVP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvitePage
