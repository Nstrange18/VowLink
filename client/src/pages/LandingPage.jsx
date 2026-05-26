import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      {/* Hero */}
      <section className="relative min-h-screen bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-6 text-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#070A13]/60" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <img src="/vowlink-icon.png" alt="Vowlink" className="h-10 w-10 object-contain" />
            <span className="font-serif text-3xl tracking-wide text-white">Vowlink</span>
          </div>

          {/* Tag */}
          <p className="text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-6">
            Digital Wedding Invitations
          </p>

          {/* Headline */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-tight mb-6">
            Your Wedding,<br />
            <span className="text-[#D8B76A]">Beautifully Shared</span>
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-white/60 max-w-md mx-auto mb-10 leading-relaxed">
            Create personalised digital invitations, manage RSVPs, track meal preferences, and share everything — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.4)]"
            >
              Get Started Free
            </Link>
            <Link
              to="/admin/login"
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:border-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <span className="text-lg">↓</span>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 sm:py-28 max-w-5xl mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-4">Why Vowlink</p>
        <h2 className="text-center font-serif text-3xl sm:text-4xl text-white mb-14">
          Everything you need for your big day
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '💌', title: 'Personalised Invites', desc: 'Custom greetings and messages for every guest, delivered via a unique link.' },
            { icon: '⏱', title: 'Live Countdown', desc: 'A real-time countdown timer on every invitation card keeps excitement building.' },
            { icon: '📲', title: 'WhatsApp Sharing', desc: 'Share invitations directly to WhatsApp with one tap — no copy-pasting needed.' },
            { icon: '🍽', title: 'Meal Preferences', desc: 'Guests pick their meal when they RSVP — your caterer will thank you.' },
            { icon: '⬇️', title: 'Downloadable Cards', desc: 'Guests can save their invite as a crisp image to keep or reshare.' },
            { icon: '📊', title: 'CSV Export', desc: 'Download your full guest list and RSVP responses with one click.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#0D1220] p-6 hover:border-[#D8B76A]/30 transition-colors duration-300">
              <span className="text-3xl block mb-4">{icon}</span>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-6 py-20 text-center border-t border-white/5">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D8B76A]/15 text-2xl">
          💍
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">Ready to start?</h2>
        <p className="text-white/50 mb-8 text-sm">Create your portal in seconds. No credit card required.</p>
        <Link
          to="/signup"
          className="inline-block rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-12 py-4 text-sm font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.4)]"
        >
          Create Your Portal
        </Link>
        <p className="mt-6 text-sm text-white/30">
          Already have an account?{' '}
          <Link to="/admin/login" className="text-[#D8B76A] hover:underline">Sign in</Link>
        </p>
      </section>
    </div>
  )
}

export default LandingPage
