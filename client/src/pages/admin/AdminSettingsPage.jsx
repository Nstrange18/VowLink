import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import { settingsSchema } from '../../utils/schemas'

const inputBase = "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition"
const inputOk = "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30"
const inputErr = "border-red-400/50"
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`

const toInputDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : ''

const AdminSettingsPage = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      partner1Name: storedUser.partner1Name || '',
      partner2Name: storedUser.partner2Name || '',
      weddingDate: toInputDate(storedUser.weddingDate),
      rsvpDeadline: toInputDate(storedUser.rsvpDeadline),
      venue: storedUser.venue || '',
    },
  })

  const p1 = watch('partner1Name')
  const p2 = watch('partner2Name')
  const weddingDate = watch('weddingDate')
  const rsvpDeadline = watch('rsvpDeadline')
  const venue = watch('venue')

  const onSubmit = async (data) => {
    try {
      const res = await api.put('/auth/me', data)
      localStorage.setItem('token', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Settings saved! ✓ Changes appear on all invitation cards.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed. Please try again.')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Account</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">Settings</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Partner names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 1 Name *</label>
            <input id="settings-p1" {...register('partner1Name')} className={cls(errors.partner1Name)} />
            {errors.partner1Name && <p className="mt-1 text-xs text-red-400">{errors.partner1Name.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 2 Name *</label>
            <input id="settings-p2" {...register('partner2Name')} className={cls(errors.partner2Name)} />
            {errors.partner2Name && <p className="mt-1 text-xs text-red-400">{errors.partner2Name.message}</p>}
          </div>
        </div>

        {/* Wedding date */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Wedding Date</label>
          <input id="settings-wedding-date" type="date" {...register('weddingDate')} className={`${cls(false)} [color-scheme:dark]`} />
          <p className="mt-1 text-xs text-white/30">Appears on all invitation cards and countdown timer.</p>
        </div>

        {/* RSVP Deadline */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">RSVP Deadline</label>
          <input id="settings-rsvp-deadline" type="date" {...register('rsvpDeadline')}
            max={weddingDate || undefined}
            className={`${cls(false)} [color-scheme:dark]`} />
          <p className="mt-1 text-xs text-white/30">Guests cannot RSVP after this date. Leave blank for no deadline.</p>
        </div>

        {/* Venue */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Venue / Location</label>
          <input id="settings-venue" placeholder="e.g. The Grand Ballroom, Victoria Island, Lagos"
            {...register('venue')} className={cls(false)} />
          <p className="mt-1 text-xs text-white/30">Shown in the Wedding Details section of every invitation.</p>
        </div>

        {/* Live preview */}
        {(p1 || p2) && (
          <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-5 py-4 space-y-1">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-widest">Preview on invitation cards</p>
            <p className="font-serif text-2xl text-white">
              {p1 || '—'} <span className="text-[#D8B76A]">&</span> {p2 || '—'}
            </p>
            {weddingDate && (
              <p className="text-sm text-white/60">
                {new Date(weddingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {rsvpDeadline && (
              <p className="text-sm text-amber-400/70">
                ⏰ RSVP by {new Date(rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {venue && <p className="text-sm text-white/40">📍 {venue}</p>}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} id="save-settings-btn"
          className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export default AdminSettingsPage
