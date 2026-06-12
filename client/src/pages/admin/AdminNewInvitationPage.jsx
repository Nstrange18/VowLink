import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTone, setAiTone] = useState("elegant")
  const [generatedMsg, setGeneratedMsg] = useState("")

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(invitationSchema),
    defaultValues: { guestName: '', greeting: '', customMessage: '', allowedGuests: 1, category: 'Guest', phoneNumber: '' },
  })

  const guestNameVal = watch('guestName') || 'Friend';
  const categoryVal = watch('category') || 'Guest';
  const customMessageVal = watch('customMessage') || '';

  const handleGenerateAiMessage = () => {
    const name = guestNameVal.trim() || "Friend";
    const firstName = name.split(" ")[0];

    const templates = {
      elegant: {
        VIP: [
          `We would be honored by your presence at our wedding, ${name}.`,
          `We request the pleasure of your company on our wedding day, ${firstName}.`
        ],
        Family: [
          `Please join us as we celebrate our marriage and family, ${name}.`,
          `We would be deeply honored to celebrate our wedding with you, ${firstName}.`
        ],
        default: [
          `We request the pleasure of your company on our wedding day, ${name}.`,
          `We would be honored by your presence at our wedding, ${firstName}.`
        ]
      },
      warm: {
        Family: [
          `Having you there as family means the world to us, ${firstName}!`,
          `Our special day wouldn't be complete without our family, ${firstName}!`
        ],
        Friend: [
          `We can't wait to celebrate our wedding day with you, ${firstName}!`,
          `Our wedding day wouldn't be complete without you, ${firstName}!`
        ],
        default: [
          `We can't wait to share our special wedding day with you, ${firstName}!`,
          `Our wedding day wouldn't be complete without you there, ${name}!`
        ]
      },
      casual: {
        Friend: [
          `Can't wait to party and celebrate our wedding with you, ${firstName}!`,
          `Get ready to celebrate and dance the night away, ${firstName}!`
        ],
        default: [
          `We are getting married! Join us for food, fun and dancing, ${firstName}!`,
          `Can't wait to celebrate and party on our wedding day, ${firstName}!`
        ]
      },
      simple: {
        default: [
          `Can't wait to see you on our wedding day, ${firstName}!`,
          `Please join us for our wedding celebration, dear ${firstName}!`,
          `We look forward to celebrating our marriage with you, ${firstName}.`
        ]
      }
    };

    const toneBucket = templates[aiTone] || templates.simple;
    let options = toneBucket[categoryVal] || toneBucket.default || templates.simple.default;
    let text = options[Math.floor(Math.random() * options.length)];

    if (text.length > 70 && text.includes(name) && name !== firstName) {
      text = text.replace(name, firstName);
    }
    if (text.length > 70) {
      text = `Join us to celebrate our wedding day, ${firstName}!`;
    }
    if (text.length < 40) {
      text = `Dear ${firstName}, please join us as we celebrate our wedding day!`;
    }
    if (text.length > 70) {
      text = text.substring(0, 67) + "...";
    }
    setGeneratedMsg(text);
  };

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
            <div className="flex items-center gap-2">
              <label className="block text-xs uppercase tracking-widest text-white/50">Personal Message *</label>
              <button
                type="button"
                onClick={() => {
                  setGeneratedMsg("")
                  setAiModalOpen(true)
                }}
                className="px-2 py-0.5 rounded-md bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                🪄 AI Message
              </button>
            </div>
            <span className={`text-[10px] ${customMessageVal.length > 70 ? 'text-red-400 font-bold' : 'text-white/30'}`}>
              {customMessageVal.length}/70
            </span>
          </div>
          <textarea id="custom-message" rows={4} placeholder="Write a personal message for this guest..." maxLength={70}
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

      {/* AI Message Helper Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#090D19] border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-fade-in">
            <div>
              <h3 className="font-serif text-xl text-white">🪄 AI Personal Message Assistant</h3>
              <p className="text-[11px] text-white/40 mt-1">
                Generate a custom wedding message for <strong className="text-white">{guestNameVal}</strong> ({categoryVal}).
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">Select Message Tone</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full rounded-xl border bg-[#070A13] border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                >
                  <option value="elegant">Elegant & Formal</option>
                  <option value="warm">Warm & Emotional</option>
                  <option value="casual">Fun & Casual</option>
                  <option value="simple">Short & Simple</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiMessage}
                className="w-full py-2.5 rounded-xl bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                Generate Message
              </button>

              {generatedMsg && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between items-center text-[10px] text-white/40">
                    <span>Generated Preview:</span>
                    <span className={generatedMsg.length > 70 || generatedMsg.length < 40 ? "text-red-400 font-bold" : "text-emerald-400"}>
                      {generatedMsg.length}/70 chars
                    </span>
                  </div>
                  <div className="bg-white/3 border border-white/5 p-3 rounded-xl text-xs text-white/80 font-mono italic leading-relaxed">
                    "{generatedMsg}"
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-xs font-semibold uppercase tracking-wider border border-white/10 hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!generatedMsg}
                onClick={() => {
                  setValue("customMessage", generatedMsg)
                  setAiModalOpen(false)
                  toast.success("Applied AI generated message! 🪄")
                }}
                className="px-5 py-2 rounded-xl bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] text-xs font-bold uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition cursor-pointer"
              >
                Apply Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNewInvitationPage
