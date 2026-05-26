import { useState } from 'react'
import api from '../../utils/api'

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"

const AdminSettingsPage = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')

  const toInputDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    partner1Name: storedUser.partner1Name || '',
    partner2Name: storedUser.partner2Name || '',
    weddingDate: toInputDate(storedUser.weddingDate),
    rsvpDeadline: toInputDate(storedUser.rsvpDeadline),
    venue: storedUser.venue || '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await api.put('/auth/me', form)
      localStorage.setItem('token', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Account</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Partner names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 1 Name *</label>
            <input id="settings-p1" name="partner1Name" value={form.partner1Name}
              onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 2 Name *</label>
            <input id="settings-p2" name="partner2Name" value={form.partner2Name}
              onChange={handleChange} required className={inputClass} />
          </div>
        </div>

        {/* Wedding date */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Wedding Date</label>
          <input id="settings-wedding-date" name="weddingDate" type="date" value={form.weddingDate}
            onChange={handleChange} className={inputClass + ' [color-scheme:dark]'} />
          <p className="mt-1 text-xs text-white/30">
            Appears on all invitation cards and RSVP confirmation page.
          </p>
        </div>

        {/* RSVP Deadline */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">RSVP Deadline</label>
          <input id="settings-rsvp-deadline" name="rsvpDeadline" type="date" value={form.rsvpDeadline}
            onChange={handleChange} className={inputClass + ' [color-scheme:dark]'} />
          <p className="mt-1 text-xs text-white/30">
            Guests cannot RSVP after this date. Leave blank for no deadline.
          </p>
        </div>

        {/* Venue */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Venue / Location</label>
          <input id="settings-venue" name="venue" value={form.venue} onChange={handleChange}
            placeholder="e.g. The Grand Ballroom, Victoria Island, Lagos"
            className={inputClass} />
          <p className="mt-1 text-xs text-white/30">
            Shown in the Wedding Details section of every invitation.
          </p>
        </div>

        {/* Live preview */}
        {(form.partner1Name || form.partner2Name) && (
          <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-5 py-4 space-y-1">
            <p className="text-xs text-white/40 mb-2 uppercase tracking-widest">Preview on invitation cards</p>
            <p className="font-serif text-2xl text-white">
              {form.partner1Name || '—'} <span className="text-[#D8B76A]">&</span> {form.partner2Name || '—'}
            </p>
            {form.weddingDate && (
              <p className="text-sm text-white/60">
                {new Date(form.weddingDate).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            {form.rsvpDeadline && (
              <p className="text-sm text-amber-400/70">
                ⏰ RSVP by {new Date(form.rsvpDeadline).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            {form.venue && <p className="text-sm text-white/40">📍 {form.venue}</p>}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-400">✓ Settings saved. Changes appear on all invitation cards.</p>
        )}

        <button type="submit" disabled={saving} id="save-settings-btn"
          className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export default AdminSettingsPage
