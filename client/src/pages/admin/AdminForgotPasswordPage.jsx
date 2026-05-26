import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A13] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <img src="/vowlink-icon.png" alt="" className="h-7 w-7 object-contain opacity-90" />
          <span className="font-serif text-xl text-white tracking-wide">Vowlink</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D8B76A]/15 text-2xl text-[#D8B76A]">
                ✉
              </div>
              <h1 className="font-serif text-2xl text-white mb-3">Check your email</h1>
              <p className="text-sm text-white/50 mb-6">
                If an account exists for <span className="text-white/80">{email}</span>, a reset link has been sent. Check your inbox (and spam folder).
              </p>
              <p className="text-xs text-white/30 mb-6">
                No email? The reset link is also printed in the server console during development.
              </p>
              <Link to="/admin/login" className="text-sm text-[#D8B76A] hover:underline">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-white mb-2">Forgot password?</h1>
              <p className="text-sm text-white/40 mb-8">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-white/40">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3.5 text-sm font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/40">
                <Link to="/admin/login" className="text-[#D8B76A] hover:underline">← Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminForgotPasswordPage
