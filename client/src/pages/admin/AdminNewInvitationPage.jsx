import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import CustomSelect from '../../components/CustomSelect'

const Field = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">{label}</label>
    {children}
  </div>
)

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"

const AdminNewInvitationPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    guestName: '',
    greeting: '',
    customMessage: '',
    allowedGuests: 1,
    category: 'Guest',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/invitations', {
        ...form,
        allowedGuests: Number(form.allowedGuests),
      })
      const slug = res.data.data.slug
      const link = `${window.location.origin}/invite/${slug}`
      navigate('/admin/invitations', { state: { newLink: link } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invitation.')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Admin</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">New Invitation</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Guest Name *">
          <input
            id="guest-name"
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
            placeholder="e.g. Chidera Okonkwo"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Greeting *">
          <input
            id="greeting"
            name="greeting"
            value={form.greeting}
            onChange={handleChange}
            placeholder="e.g. Dear Chidera,"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Custom Invitation Message *">
          <textarea
            id="custom-message"
            name="customMessage"
            value={form.customMessage}
            onChange={handleChange}
            placeholder="Write a personal message for this guest..."
            required
            rows={4}
            className={inputClass + ' resize-none'}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Allowed Guests">
            <input
              id="allowed-guests"
              name="allowedGuests"
              type="number"
              min={1}
              max={10}
              value={form.allowedGuests}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <CustomSelect
              name="category"
              value={form.category}
              onChange={handleChange}
              options={[
                { value: 'Guest', label: 'Guest' },
                { value: 'Family', label: 'Family' },
                { value: 'Friend', label: 'Friend' },
                { value: 'Colleague', label: 'Colleague' },
                { value: 'VIP', label: 'VIP' },
              ]}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            id="submit-invitation-btn"
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Invitation'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/invitations')}
            className="rounded-full border border-white/15 px-8 py-3 text-sm text-white/60 transition hover:border-white/30 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminNewInvitationPage
