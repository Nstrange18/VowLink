import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import api from '../../utils/api'
import CustomSelect from '../../components/CustomSelect'

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"

const AdminEditInvitationPage = () => {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (state?.invitation) {
      const inv = state.invitation
      setForm({
        guestName: inv.guestName,
        greeting: inv.greeting,
        customMessage: inv.customMessage,
        allowedGuests: inv.allowedGuests,
        category: inv.category || 'Guest',
      })
      setFetching(false)
    } else {
      // fallback: fetch all and find by id
      api.get('/invitations').then((res) => {
        const found = res.data.find((i) => i._id === id)
        if (found) {
          setForm({
            guestName: found.guestName,
            greeting: found.greeting,
            customMessage: found.customMessage,
            allowedGuests: found.allowedGuests,
            category: found.category || 'Guest',
          })
        }
      }).finally(() => setFetching(false))
    }
  }, [id, state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/invitations/${id}`, {
        ...form,
        allowedGuests: Number(form.allowedGuests),
      })
      navigate('/admin/invitations')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update invitation.')
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-white/40">Loading...</div>
  if (!form) return <div className="p-8 text-red-400">Invitation not found.</div>

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Admin</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">Edit Invitation</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Guest Name *</label>
          <input name="guestName" value={form.guestName} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Greeting *</label>
          <input name="greeting" value={form.greeting} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Custom Message *</label>
          <textarea name="customMessage" value={form.customMessage} onChange={handleChange} required rows={4} className={inputClass + ' resize-none'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Allowed Guests</label>
            <input name="allowedGuests" type="number" min={1} max={10} value={form.allowedGuests} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Category</label>
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
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/admin/invitations')} className="rounded-full border border-white/15 px-8 py-3 text-sm text-white/60 transition hover:border-white/30 hover:text-white">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminEditInvitationPage
