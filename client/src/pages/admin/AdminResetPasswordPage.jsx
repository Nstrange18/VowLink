import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

const AdminResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm)
      return setError("Passwords don't match.")
    setLoading(true)
    setError('')
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password })
      setDone(true)
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition pr-11"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A13] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <img src="/vowlink-icon.png" alt="" className="h-7 w-7 object-contain opacity-90" />
          <span className="font-serif text-xl text-white tracking-wide">Vowlink</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-2xl text-emerald-400">✓</div>
              <h1 className="font-serif text-2xl text-white mb-3">Password reset!</h1>
              <p className="text-sm text-white/50">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-white mb-2">New password</h1>
              <p className="text-sm text-white/40 mb-8">Choose a strong password (min. 6 characters).</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-white/40">New Password</label>
                  <div className="relative">
                    <input
                      type={show.password ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      <EyeIcon open={show.password} />
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-white/40">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={show.confirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Repeat password"
                      required
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      <EyeIcon open={show.confirm} />
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3.5 text-sm font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
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

export default AdminResetPasswordPage
