import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
    )}
  </svg>
)

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 transition"

const SignupPage = () => {
  const [form, setForm] = useState({
    partner1Name: '', partner2Name: '', email: '',
    password: '', confirmPassword: '', weddingDate: '', venue: '', rsvpDeadline: '',
  })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', {
        partner1Name: form.partner1Name,
        partner2Name: form.partner2Name,
        email: form.email,
        password: form.password,
        weddingDate: form.weddingDate || null,
        rsvpDeadline: form.rsvpDeadline || null,
        venue: form.venue || '',
      })
      localStorage.setItem('token', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg.png')] bg-cover bg-top bg-no-repeat px-6 py-10">
      <div className="w-full max-w-md rounded-[24px] border border-[#D8B76A]/40 bg-[#070A13]/85 px-8 py-12 shadow-2xl backdrop-blur-md">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A]">Create Your Account</p>
        <h1 className="mb-2 text-center font-serif text-3xl text-white">Start Your Journey</h1>
        <p className="mb-8 text-center text-sm text-white/40">Set up your wedding invitation portal</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Partner names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 1 *</label>
              <input id="partner1-name" name="partner1Name" value={form.partner1Name} onChange={handleChange}
                placeholder="e.g. Allen" required className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Partner 2 *</label>
              <input id="partner2-name" name="partner2Name" value={form.partner2Name} onChange={handleChange}
                placeholder="e.g. Justina" required className={inputClass} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Email *</label>
            <input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" required className={inputClass} />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Password *</label>
            <div className="relative">
              <input id="signup-password" name="password" type={show.password ? 'text' : 'password'}
                value={form.password} onChange={handleChange} placeholder="Min 6 characters" required
                className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                <EyeIcon open={show.password} />
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Confirm Password *</label>
            <div className="relative">
              <input id="signup-confirm-password" name="confirmPassword" type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required
                className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                <EyeIcon open={show.confirm} />
              </button>
            </div>
          </div>

          {/* Wedding date */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Wedding Date</label>
            <input id="wedding-date" name="weddingDate" type="date" value={form.weddingDate}
              onChange={handleChange} className={inputClass + ' [color-scheme:dark]'} />
            <p className="mt-1 text-xs text-white/30">You can update this later in Settings.</p>
          </div>

          {/* RSVP Deadline */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">RSVP Deadline</label>
            <input id="signup-rsvp-deadline" name="rsvpDeadline" type="date" value={form.rsvpDeadline}
              onChange={handleChange} className={inputClass + ' [color-scheme:dark]'} />
            <p className="mt-1 text-xs text-white/30">Cut-off date for RSVPs. Leave blank for no deadline.</p>
          </div>

          {/* Venue */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">Venue / Location</label>
            <input id="signup-venue" name="venue" value={form.venue} onChange={handleChange}
              placeholder="e.g. The Grand Ballroom, Lagos" className={inputClass} />
            <p className="mt-1 text-xs text-white/30">Shown on your guests' invitation cards.</p>
          </div>

          {/* Preview */}
          {(form.partner1Name || form.partner2Name) && (
            <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-4 py-3 text-center">
              <p className="text-xs text-white/40 mb-1 uppercase tracking-widest">Your invitation portal</p>
              <p className="font-serif text-lg text-white">
                {form.partner1Name || '—'} <span className="text-[#D8B76A]">&</span> {form.partner2Name || '—'}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} id="signup-submit-btn"
            className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link to="/admin/login" className="text-[#D8B76A] hover:underline">Sign in</Link>
        </p>
      </div>
    </section>
  )
}

export default SignupPage
