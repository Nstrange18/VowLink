import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

const pages = {
  features: {
    eyebrow: 'Features',
    title: 'Digital wedding invitation tools for couples who need beauty and control',
    description: 'VowLink helps couples create personalized invitation links, track RSVPs, manage guest categories, send WhatsApp messages, and keep wedding details organized in one private dashboard.',
    primary: 'Create Your Wedding Portal',
    secondary: 'See Pricing',
    secondaryTo: '/pricing',
    sections: [
      ['Personal guest links', 'Give each guest a private invitation page with their name, custom message, RSVP limit, category, and sender group.'],
      ['RSVP and response tracking', 'Monitor who is attending, who declined, and who has not responded yet, with dashboard totals that stay easy to read.'],
      ['WhatsApp sharing workflow', 'Prepare personalized messages and open WhatsApp for each guest without manually rebuilding invite links.'],
      ['Wedding design controls', 'Customize templates, couple photos, color themes, music, galleries, dress code, venue details, and invitation downloads.'],
      ['Planning dashboard', 'Keep invitations, RSVPs, seating plans, venue suggestions, billing, and settings connected to the same wedding workspace.'],
      ['Guest experience', 'Give guests a polished invite page with RSVP forms, wish wall, schedule details, registry information, and cash gifting options.'],
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Start with Classic, then upgrade when your guest list needs more room',
    description: 'VowLink has simple wedding invitation plans for small celebrations, growing guest lists, and full planning workflows with premium templates and exports.',
    primary: 'Start with Classic',
    secondary: 'View Features',
    secondaryTo: '/features',
    sections: [
      ['Classic', 'Create one invite link, collect up to 20 RSVPs, and use the Classic Floral and Modern Minimalist templates for intimate celebrations.'],
      ['Plus', 'Unlock more guest links, premium templates, music, gallery, venue details, and richer invitation personalization.'],
      ['Pro', 'Use larger guest limits, RSVP export, seating chart tools, WhatsApp queues, AI-assisted themes, and more advanced planning controls.'],
    ],
  },
  templates: {
    eyebrow: 'Templates',
    title: 'Wedding invitation templates made for elegant digital sharing',
    description: 'Choose a VowLink invitation style, add your couple photo or themed background, and adjust colors, text, music, and wedding details for your guests.',
    primary: 'Create an Invitation',
    secondary: 'See Features',
    secondaryTo: '/features',
    sections: [
      ['Formal wedding styles', 'Use refined layouts for traditional ceremonies, black-tie weddings, church weddings, and reception-first celebrations.'],
      ['Photo-led invitations', 'Make your couple photo the main visual moment while keeping names, date, RSVP, and venue details readable.'],
      ['Color and theme control', 'Set wedding colors, card backgrounds, typography feel, music, gallery images, and guest-facing message tone.'],
    ],
  },
}

const MarketingPage = ({ page }) => {
  const content = pages[page] || pages.features

  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      <header className="border-b border-white/5 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/vowlink-icon.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="font-serif text-2xl text-white">VowLink</span>
          </Link>
          <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.22em] text-white/50 sm:flex">
            <Link to="/features" className="hover:text-[#D8B76A]">Features</Link>
            <Link to="/templates" className="hover:text-[#D8B76A]">Templates</Link>
            <Link to="/pricing" className="hover:text-[#D8B76A]">Pricing</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl">
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#D8B76A]">{content.eyebrow}</p>
            <h1 className="font-serif text-4xl leading-tight text-white sm:text-6xl">{content.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60">{content.description}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-8 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#070A13]">
                {content.primary}
              </Link>
              <Link to={content.secondaryTo} className="rounded-full border border-white/15 px-8 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white/75">
                {content.secondary}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#0D1220]/50 px-6 py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
            {content.sections.map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-[#070A13]/70 p-6">
                <Icon icon="lucide:sparkles" className="mb-4 h-5 w-5 text-[#D8B76A]" />
                <h2 className="font-serif text-2xl text-white">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 py-20 text-center">
          <h2 className="font-serif text-3xl text-white sm:text-4xl">Build a guest-ready wedding portal</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50">
            Create your first invitation, preview the guest experience, and start collecting RSVPs from one organized workspace.
          </p>
          <Link to="/signup" className="mt-8 inline-block rounded-full bg-[#D8B76A] px-10 py-4 text-xs font-bold uppercase tracking-widest text-[#070A13]">
            Get Started
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VowLink. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy" className="transition hover:text-[#D8B76A]">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-[#D8B76A]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingPage
