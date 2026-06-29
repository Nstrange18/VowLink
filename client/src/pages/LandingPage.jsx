import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

const featureCards = [
  { icon: '01', title: 'Personalized Invites', desc: 'Create unique guest links with custom greetings, guest categories, seating counts, and private RSVP tracking.' },
  { icon: '02', title: 'RSVP Management', desc: 'See who is attending, capture meal preferences and guest messages, and export your list when you need it.' },
  { icon: '03', title: 'WhatsApp Sharing', desc: 'Send each invitation through WhatsApp with prepared messages, phone numbers, and partner sender queues.' },
  { icon: '04', title: 'Design Control', desc: 'Choose templates, colors, music, couple photos, galleries, and premium backgrounds that match your wedding style.' },
  { icon: '05', title: 'Venue Planning', desc: 'Browse venue suggestions, unlock maps and contact details, shortlist favorites, and send inquiries on Pro.' },
  { icon: '06', title: 'Wedding Tools', desc: 'Use RSVP limits, seating charts, timelines, registry details, and dashboard insights from one wedding workspace.' },
]

const steps = [
  { title: 'Set up your couple portal', desc: 'Add your names, wedding date, RSVP deadline, dress code, venue, registry, and invitation preferences.' },
  { title: 'Import or create guests', desc: 'Add one guest at a time or bulk import a spreadsheet with categories, phone numbers, and sender groups.' },
  { title: 'Share and track responses', desc: 'Send links by WhatsApp, watch RSVPs come in, manage guests, and keep your list organized until the big day.' },
]

const plans = [
  { name: 'Free', detail: '1 invite link, 20 RSVPs, basic templates.' },
  { name: 'Plus', detail: '100 guest links, premium templates, music, gallery, full venue details.' },
  { name: 'Pro', detail: '500 guest links, RSVP export, seating chart, WhatsApp queues, AI themes.' },
]

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      <section className="landing-hero relative min-h-screen bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-[#070A13]/60" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <img src="/vowlink-icon.png" alt="Vowlink" className="h-10 w-10 object-contain" />
            <span className="font-serif text-3xl tracking-wide text-white">Vowlink</span>
          </div>

          <p className="text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-6">
            Digital Wedding Invitations
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-tight mb-6">
            Your Wedding,<br />
            <span className="text-[#D8B76A]">Beautifully Shared</span>
          </h1>

          <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto mb-10 leading-relaxed">
            Build your invitation portal, share personal guest links, collect RSVPs, and keep the planning details organized from one elegant workspace.
          </p>

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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <span className="text-lg">↓</span>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 max-w-6xl mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-4">Why Vowlink</p>
        <h2 className="text-center font-serif text-3xl sm:text-4xl text-white mb-5">
          A calmer way to manage wedding invitations
        </h2>
        <p className="text-center text-sm text-white/50 max-w-2xl mx-auto mb-14 leading-relaxed">
          Vowlink keeps the guest experience beautiful while giving couples practical tools for RSVPs, guest limits, message sharing, and planning decisions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#0D1220] p-6 hover:border-[#D8B76A]/30 transition-colors duration-300">
              <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#D8B76A]/15 text-xs font-bold text-[#D8B76A]">{icon}</span>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0D1220]/40 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-4">How It Works</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
              From guest list to RSVP tracking in three steps
            </h2>
          </div>
          <div className="lg:col-span-8 grid gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-[#070A13]/60 p-5">
                <div className="flex gap-4">
                  <span className="text-xs font-bold text-[#D8B76A]">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24 max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#D8B76A] mb-4">Plans</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">Start free, upgrade when you need more</h2>
          </div>
          <Link to="/admin/billing" className="text-sm font-semibold text-[#D8B76A] hover:underline">
            View billing after signup
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-2xl border border-white/10 bg-[#0D1220] p-6">
              <h3 className="font-serif text-2xl text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">{plan.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center border-t border-white/5">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D8B76A]/15 text-sm font-bold text-[#D8B76A]">
          VL
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

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/vowlink-icon.png" alt="" className="h-7 w-7 object-contain" />
              <span className="font-serif text-xl text-white">Vowlink</span>
            </div>
            <p className="mt-2 text-xs text-white/40">Digital wedding invitations, RSVP tracking, and guest planning tools.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/50">
            <Link to="/signup" className="hover:text-[#D8B76A]">Create account</Link>
            <Link to="/admin/login" className="hover:text-[#D8B76A]">Couple login</Link>
            <Link to="/venue/login" className="hover:text-[#D8B76A]">Venue portal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
