import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import CustomSelect from '../../components/CustomSelect'
import { invitationSchema } from '../../utils/schemas'
import AiMessageAssist from '../../components/AiMessageAssist'

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
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'))

  // Derive couple names and formatted wedding date from the stored user profile
  const coupleNames = [user.partner1Name, user.partner2Name].filter(Boolean).join(' and ')
  const weddingDate = user.weddingDate
    ? new Date(user.weddingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await api.get('/invitations')
        const count = res.data.length
        const tier = user.tier || 'free'
        const limit = tier === 'free' ? 1 : tier === 'plus' ? 100 : 500
        if (count >= limit) {
          toast.warning(`You have reached the limit of ${limit} invitation${limit === 1 ? '' : 's'} for the ${tier.toUpperCase()} plan. Redirecting to billing...`, { toastId: 'limit-reached-redirect' })
          navigate('/admin/billing')
        }
      } catch (err) {
        console.error(err)
      }
    }
    checkLimit()
  }, [navigate, user.tier])

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(invitationSchema),
    defaultValues: { guestName: '', greeting: '', customMessage: '', allowedGuests: 1, category: 'Guest', phoneNumber: '', senderGroup: 'general' },
  })

  const guestNameVal = watch('guestName') || 'Friend';
  const categoryVal = watch('category') || 'Guest';
  const customMessageVal = watch('customMessage') || '';



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

      {/* Global personalization settings reminder */}
      <div className="mb-6 rounded-xl border border-white/5 bg-white/3 px-4 py-3 flex items-start gap-2.5 text-xs text-white/50 leading-relaxed">
        <span className="text-sm mt-0.5">💡</span>
        <span>
          Designs, background templates, custom fonts, colors, and music are applied globally. Visit the{" "}
          <Link to="/admin/settings" className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition">
            Settings Page
          </Link>{" "}
          to customize them.
        </span>
      </div>

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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs uppercase tracking-widest text-white/50">Personal Message *</label>
            <span className={`text-[10px] ${customMessageVal.length > 170 ? 'text-red-400 font-bold' : 'text-white/30'}`}>
              {customMessageVal.length}/170
            </span>
          </div>
          <textarea id="custom-message" rows={4} placeholder="Write a personal message for this guest..." maxLength={170}
            {...register('customMessage')} className={`${cls(errors.customMessage)} resize-none`} />
          {errors.customMessage && <p className="mt-1 text-xs text-red-400">{errors.customMessage.message}</p>}
          {/* AI Assist panel */}
          <AiMessageAssist
            guestName={guestNameVal}
            coupleNames={coupleNames}
            weddingDate={weddingDate}
            currentMessage={customMessageVal}
            onApply={(text) => setValue('customMessage', text, { shouldValidate: true })}
          />
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

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Guest Phone Number (WhatsApp format, e.g. 2348012345678)</label>
          <input
            id="phone-number"
            placeholder="e.g. 2348031234567"
            {...register('phoneNumber')}
            className={cls(errors.phoneNumber)}
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-400">{errors.phoneNumber.message}</p>}
          <p className="mt-1 text-[10px] text-white/30">Optional. Include country code without "+" or space. Used for launching direct WhatsApp messages.</p>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Send Invite By</label>
          <select
            id="sender-group"
            {...register('senderGroup')}
            className="w-full rounded-xl border bg-white/5 border-white/10 px-4 py-3 text-sm text-white focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 outline-none transition"
          >
            <option value="general" className="bg-[#070A13]">General</option>
            <option value="bride" className="bg-[#070A13]">Bride</option>
            <option value="groom" className="bg-[#070A13]">Groom</option>
            <option value="both" className="bg-[#070A13]">Both</option>
          </select>
          {errors.senderGroup && <p className="mt-1 text-xs text-red-400">{errors.senderGroup.message}</p>}
          <p className="mt-1 text-[10px] text-white/30 font-serif">Select who is responsible for sending this guest their invitation link.</p>
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
