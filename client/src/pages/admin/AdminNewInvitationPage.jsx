import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import CustomSelect from '../../components/CustomSelect'
import { invitationSchema } from '../../utils/schemas'

const CATEGORIES = [
  { value: 'Guest', label: 'Guest' },
  { value: 'Family', label: 'Family' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Colleague', label: 'Colleague' },
  { value: 'VIP', label: 'VIP' },
]

const inputBase = "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition"
const inputOk = "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30"
const inputErr = "border-red-400/50 focus:border-red-400/70"
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`

const AdminNewInvitationPage = () => {
  const navigate = useNavigate()

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(invitationSchema),
    defaultValues: { guestName: '', greeting: '', customMessage: '', allowedGuests: 1, category: 'Guest' },
  })

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/invitations', { ...data, allowedGuests: Number(data.allowedGuests) })
      const slug = res.data.data.slug
      const link = `${window.location.origin}/invite/${slug}`
      toast.success('Invitation created! 💌')
      navigate('/admin/invitations', { state: { newLink: link } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invitation.')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Admin</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6 sm:mb-8">New Invitation</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Guest Name *</label>
          <input id="guest-name" placeholder="e.g. Chidera Okonkwo" {...register('guestName')} className={cls(errors.guestName)} />
          {errors.guestName && <p className="mt-1 text-xs text-red-400">{errors.guestName.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Greeting *</label>
          <input id="greeting" placeholder="e.g. Dear Chidera," {...register('greeting')} className={cls(errors.greeting)} />
          {errors.greeting && <p className="mt-1 text-xs text-red-400">{errors.greeting.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Personal Message *</label>
          <textarea id="custom-message" rows={4} placeholder="Write a personal message for this guest..."
            {...register('customMessage')} className={`${cls(errors.customMessage)} resize-none`} />
          {errors.customMessage && <p className="mt-1 text-xs text-red-400">{errors.customMessage.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Allowed Guests</label>
            <input id="allowed-guests" type="number" min={1} max={10} {...register('allowedGuests')} className={cls(errors.allowedGuests)} />
            {errors.allowedGuests && <p className="mt-1 text-xs text-red-400">{errors.allowedGuests.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Category</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  name="category"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={CATEGORIES}
                />
              )}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={isSubmitting} id="submit-invitation-btn"
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
            {isSubmitting ? 'Creating...' : 'Create Invitation'}
          </button>
          <button type="button" onClick={() => navigate('/admin/invitations')}
            className="rounded-full border border-white/15 px-8 py-3 text-sm text-white/60 transition hover:border-white/30 hover:text-white">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminNewInvitationPage
