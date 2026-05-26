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
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#070A13' })
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

  return (
    <div className="min-h-screen bg-[#070A13]">
      {/* HERO — dark floral frame bg, card centred in dark middle */}
      <section className="relative min-h-screen bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center gap-4 px-5 sm:px-8 py-20 sm:py-24">

          {/* The downloadable card — DARK THEME */}
          <div
            ref={cardRef}
            className="w-full max-w-[340px] sm:max-w-md rounded-[28px] border border-[#D8B76A]/30 bg-[#070A13] px-5 sm:px-8 py-8 sm:py-12 text-center shadow-[0_20px_80px_rgba(0,0,0,0.9)]"
          >
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#D8B76A]">
            You are cordially invited
          </p>

          {/* Couple names */}
          <h1 className="font-serif text-4xl sm:text-5xl font-normal leading-tight text-white">
            {invitation.userId?.partner1Name || 'Partner 1'}
          </h1>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal leading-tight text-white">
            <span className="text-[#D8B76A]">&</span>{' '}
            {invitation.userId?.partner2Name || 'Partner 2'}
          </h1>

          {/* Divider */}
          <div className="my-5 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-[#D8B76A]" />
            <span className="text-[#D8B76A] text-sm">◇</span>
            <div className="h-px w-10 bg-[#D8B76A]" />
          </div>

          {/* Greeting + message */}
          <p className="mb-3 text-base sm:text-lg font-medium text-[#D8B76A]/80">{invitation.greeting}</p>
          <p className="mx-auto mb-6 max-w-xs text-sm leading-7 text-white/60">{invitation.customMessage}</p>

          {/* Countdown timer */}
          {countdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
            <div className="mb-6">
              <p className="mb-3 text-xs uppercase tracking-widest text-[#D8B76A]">Counting down</p>
              <div className="flex items-end justify-center gap-2 sm:gap-3">
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

          {/* Wedding date */}
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="text-[#D8B76A] text-base">◈</span>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
              {weddingDate
                ? new Date(weddingDate).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  }).toUpperCase()
                : 'DATE TO BE ANNOUNCED'}
            </p>
          </div>

          {/* Venue — clickable → Google Maps */}
          {venue && (
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="text-[#D8B76A] text-base">📍</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-[#D8B76A] underline underline-offset-2 transition"
              >
                {venue}
              </a>
            </div>
          )}

          {/* Colour of the day */}
          <div className="mx-auto mb-5 max-w-xs rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-5 py-4">
            <span className="text-[#D8B76A] text-base block mb-1">✦</span>
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[#D8B76A]">Colour of the Day</p>
            <p className="text-sm font-medium text-white/80">White • Champagne Gold • Blue</p>
          </div>

          {/* RSVP deadline */}
          {rsvpDeadline && (
            <div className={`mb-5 flex items-center justify-center gap-2 rounded-xl border px-4 py-2 ${
              deadlinePassed
                ? 'border-red-400/30 bg-red-400/10 text-red-400'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
            }`}>
              <span>{deadlinePassed ? '🔒' : '⏰'}</span>
              <p className="text-xs font-medium">
                {deadlinePassed
                  ? 'RSVP closed'
                  : `RSVP by ${new Date(rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                }
              </p>
            </div>
          )}

          {/* Category badge */}
          <div className="mb-6 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#D8B76A]">
              <span>✦</span>{invitation.category || 'Guest'}
            </span>
          </div>

          {/* RSVP button / confirmed / closed */}
          {invitation.hasRSVPed ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-4">
              <p className="text-sm text-emerald-400">✓ We've received your RSVP. Thank you!</p>
            </div>
          ) : deadlinePassed ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-4">
              <p className="text-sm text-red-400">🔒 RSVP is now closed. Thank you!</p>
            </div>
          ) : (
            <button
              id="rsvp-open-btn"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 sm:px-10 py-3.5 sm:py-4 text-sm font-bold uppercase tracking-widest text-[#070A13] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.4)]"
            >
              ✦ RSVP Now
            </button>
          )}
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-white/70 backdrop-blur-sm transition hover:bg-black/70 hover:text-white disabled:opacity-50">
              {downloading ? <span className="animate-pulse">Downloading...</span> : <><span>⬇</span> Download</>}
            </button>
            <button onClick={handleWhatsAppShare}
              className="flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-[#25D366] backdrop-blur-sm transition hover:bg-[#25D366]/20">
              <span>📲</span> Share
            </button>
          </div>
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

      {/* Floating download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        title="Download your invitation as an image"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[#D8B76A]/40 bg-[#1A2E4A]/90 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] shadow-xl backdrop-blur-md transition hover:bg-[#1A2E4A] hover:shadow-[0_8px_30px_rgba(216,183,106,0.25)] disabled:opacity-50"
      >
        {downloading ? <span className="animate-pulse">Downloading...</span> : <><span className="text-sm">⬇</span> Download</>}
      </button>

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
