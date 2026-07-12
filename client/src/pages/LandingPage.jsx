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

const venueBenefits = [
  { icon: 'lucide:badge-check', title: 'Verified profile', desc: 'Show couples your capacity, location, style, price range, proof status, and contact channels in one structured listing.' },
  { icon: 'lucide:image', title: 'Gallery-led trust', desc: 'Upload venue photos, keep your listing fresh, and make it easier for couples to understand the space before they inquire.' },
  { icon: 'lucide:mail', title: 'Direct leads', desc: 'Receive couple inquiries from the VowLink venue directory and track interest from your venue dashboard.' },
  { icon: 'lucide:sparkles', title: 'Featured placement', desc: 'Upgrade from directory listing to featured visibility when you want more attention from planning couples.' },
]

const faqs = [
  {
    question: 'Can guests RSVP from their phones?',
    answer: 'Yes. Each guest receives a personal invite link that opens on mobile and lets them view details, RSVP, leave wishes, and follow any wedding instructions you add.',
  },
  {
    question: 'Can we send invitations through WhatsApp?',
    answer: 'Yes. VowLink prepares guest-specific invitation links and WhatsApp messages so you can send them without manually copying every detail.',
  },
  {
    question: 'Can we control who invited each guest?',
    answer: 'Yes. Guests can be grouped by bride, groom, or both, which keeps sender lists and dashboard counts easier to manage.',
  },
  {
    question: 'Do we need a designer to create the invite?',
    answer: 'No. You can choose a template, upload a couple photo, set colors, add music, and update wedding details directly from your couple dashboard.',
  },
  {
    question: 'Will private wedding dashboard pages show on Google?',
    answer: 'No. The public marketing pages are prepared for search indexing, while admin, login, dashboard, RSVP response, and guest invite routes are marked as private.',
  },
  {
    question: 'Can venues join VowLink too?',
    answer: 'Yes. Venues can create a partner listing, add photos and contact details, receive inquiries from planning couples, and upgrade for stronger visibility.',
  },
]

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      <section className="landing-hero relative min-h-screen bg-[url('/hero-bg.webp')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-[#070A13]/60" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <img src="/vowlink-icon.webp" alt="Vowlink" className="h-10 w-10 object-contain" />
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
          <Icon icon="lucide:arrow-down" className="h-4 w-4" />
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

      <section className="border-y border-white/5 bg-[#0D1220]/40 px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#D8B76A]">For Venues</p>
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
              Help wedding couples discover and trust your space
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
              VowLink is not only for invitations. Venue partners can create a searchable listing, show photos and location details, receive inquiries, and upgrade visibility when they want stronger placement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/venue/register"
                className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#070A13]"
              >
                List Your Venue
              </Link>
              <Link
                to="/venue/login"
                className="rounded-full border border-white/15 px-8 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white/75 transition hover:border-[#D8B76A]/35 hover:text-[#D8B76A]"
              >
                Venue Portal
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {venueBenefits.map((benefit) => (
              <article key={benefit.title} className="rounded-3xl border border-white/10 bg-[#070A13]/70 p-5 transition hover:border-[#D8B76A]/30">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#D8B76A]/15 text-[#D8B76A]">
                  <Icon icon={benefit.icon} className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{benefit.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-guest-cta px-6 py-20">
        <div className="landing-guest-cta-panel mx-auto grid max-w-6xl grid-cols-1 overflow-hidden rounded-4xl border border-[#D8B76A]/20 bg-[#111827] lg:grid-cols-12">
          <div className="p-8 sm:p-10 lg:col-span-7 lg:p-12">
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#D8B76A]">For Your Guest List</p>
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
              Send a polished invitation before the first RSVP reminder
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
              Create the invite, assign guest categories, prepare WhatsApp messages, and give guests one beautiful link with the details they need.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#070A13]"
              >
                Create Your Portal
              </Link>
              <Link
                to="/features"
                className="landing-guest-secondary rounded-full border border-white/15 px-8 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white/75"
              >
                Explore Features
              </Link>
            </div>
          </div>
          <div className="landing-guest-cta-list border-t border-white/10 bg-[#070A13]/70 p-8 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-12">
            <div className="grid gap-5">
              {[
                ['Guest links', 'Personalized pages for each invitee'],
                ['RSVP totals', 'Clear counts for attending and pending guests'],
                ['WhatsApp-ready', 'Messages prepared around each guest link'],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D8B76A]/15 text-[#D8B76A]">
                    <Icon icon="lucide:check" className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-white/45">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-faq border-y border-white/5 bg-[#0D1220]/40 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#D8B76A]">FAQ</p>
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">Questions before you send the link</h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              Clear answers for couples setting up their first digital wedding invitation portal.
            </p>
          </div>
          <div className="grid gap-5 lg:col-span-8">
            {faqs.map((faq, index) => (
              <article key={faq.question} className="landing-faq-card group rounded-3xl border border-white/10 bg-[#070A13]/60 p-5 transition hover:border-[#D8B76A]/35 sm:p-6">
                <div className="flex gap-4">
                  <span className="landing-faq-index flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[10px] font-bold text-[#D8B76A]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{faq.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
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

      <footer className="landing-footer relative overflow-hidden border-t border-[#D8B76A]/15 bg-[#050814] px-6 py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D8B76A]/70 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-xl -translate-x-1/2 rounded-full bg-[#D8B76A]/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/10">
                  <img src="/vowlink-icon.webp" alt="" className="h-7 w-7 object-contain" />
                </span>
                <span className="font-serif text-2xl text-white">Vowlink</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Digital wedding invitations, RSVP tracking, guest planning, and sharing tools for modern celebrations.
              </p>
              <Link
                to="/signup"
                className="mt-6 inline-flex rounded-full bg-[#D8B76A] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:bg-[#F2D894]"
              >
                Start Free
              </Link>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">Explore</p>
              <div className="flex flex-col gap-3 text-sm text-white/55">
                <Link to="/features" className="transition hover:text-[#D8B76A]">Features</Link>
                <Link to="/templates" className="transition hover:text-[#D8B76A]">Templates</Link>
                <Link to="/pricing" className="transition hover:text-[#D8B76A]">Pricing</Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">Portals</p>
              <div className="flex flex-col gap-3 text-sm text-white/55">
                <Link to="/signup" className="transition hover:text-[#D8B76A]">Create account</Link>
                <Link to="/admin/login" className="transition hover:text-[#D8B76A]">Couple login</Link>
                <Link to="/venue/register" className="transition hover:text-[#D8B76A]">List a venue</Link>
                <Link to="/venue/login" className="transition hover:text-[#D8B76A]">Venue portal</Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/3 p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">Contact Us</p>
              <div className="flex flex-col gap-3 text-sm text-white/60">
                <a href="mailto:hello@vowlink.co" className="group flex items-center gap-3 transition hover:text-[#D8B76A]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="lucide:mail" className="h-4 w-4" />
                  </span>
                  <span>hello@vowlink.co</span>
                </a>
                <a href="https://wa.me/2349127315930" target="_blank" rel="noreferrer" className="group flex items-center gap-3 transition hover:text-[#D8B76A]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                  </span>
                  <span>09127315930</span>
                </a>
                <a href="https://instagram.com/vowlink.co" target="_blank" rel="noreferrer" className="group flex items-center gap-3 transition hover:text-[#D8B76A]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="ri:instagram-line" className="h-4 w-4" />
                  </span>
                  <span>@vowlink.co</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Vowlink. All rights reserved.</p>
            <p>Made for wedding planning, guest care, and beautiful invitations.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
