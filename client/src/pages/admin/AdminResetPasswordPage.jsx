import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import { resetPasswordSchema } from '../../utils/schemas'

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {open ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>) : (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>)}
  </svg>
)

const AdminResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [show, setShow] = useState({ password: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password })
      toast.success('Password reset! Please sign in with your new password.')
      navigate('/admin/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.')
      setLoading(false)
    }
  }

  const cls = (err) => `w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition ${err ? 'border-red-400/50' : 'border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30'}`

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg.png')] bg-cover bg-top bg-no-repeat px-6">
      <div className="w-full max-w-sm rounded-[24px] border border-[#D8B76A]/40 bg-[#070A13]/85 px-8 py-12 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A]">Account Recovery</p>
        <h1 className="mb-2 text-center font-serif text-3xl text-white">Set New Password</h1>
        <p className="mb-8 text-center text-sm text-white/40">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">New Password</label>
            <div className="relative">
              <input id="reset-password" type={show.password ? 'text' : 'password'} placeholder="Min 6 characters"
                {...register('password')} className={`${cls(errors.password)} pr-11`} />
              <button type="button" onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"><EyeIcon open={show.password} /></button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Confirm Password</label>
            <div className="relative">
              <input id="reset-confirm" type={show.confirm ? 'text' : 'password'} placeholder="Repeat password"
                {...register('confirm')} className={`${cls(errors.confirm)} pr-11`} />
              <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"><EyeIcon open={show.confirm} /></button>
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={loading} id="reset-submit-btn"
            className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/admin/login" className="text-[#D8B76A] hover:underline text-xs">← Back to Sign In</Link>
        </p>
      </div>
    </section>
  )
}

export default AdminResetPasswordPage
