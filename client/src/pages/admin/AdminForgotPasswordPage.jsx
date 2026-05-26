import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import api from '../../utils/api'
import { forgotPasswordSchema } from '../../utils/schemas'

const AdminForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      setSent(true)
      toast.success('Reset link sent! Check your inbox (or server console in dev).')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg2.png')] bg-cover bg-top bg-no-repeat px-6">
      <div className="w-full max-w-sm rounded-[24px] border border-[#D8B76A]/40 bg-[#070A13]/85 px-8 py-12 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A]">Account Recovery</p>
        <h1 className="mb-2 text-center font-serif text-3xl text-white">Forgot Password?</h1>
        <p className="mb-8 text-center text-sm text-white/40">
          Enter your email and we'll send a reset link.
        </p>

        {sent ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-5 text-center">
            <p className="text-emerald-400 text-sm mb-2">✓ Email sent!</p>
            <p className="text-white/50 text-xs">Check your inbox. The link expires in 1 hour.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Email Address</label>
              <input id="forgot-email" type="email" placeholder="your@email.com"
                {...register('email')}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition ${errors.email ? 'border-red-400/50' : 'border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30'}`} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={loading} id="forgot-submit-btn"
              className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/40">
          <Link to="/admin/login" className="text-[#D8B76A] hover:underline">← Back to Sign In</Link>
        </p>
      </div>
    </section>
  )
}

export default AdminForgotPasswordPage
