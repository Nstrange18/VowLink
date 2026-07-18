import { Link } from 'react-router-dom'

const updatedAt = '18 July 2026'

const pageContent = {
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'VowLink Privacy Policy',
    intro:
      'This Privacy Policy explains how VowLink collects, uses, stores, and protects information when couples, guests, and venue partners use our digital wedding invitation and RSVP services.',
    sections: [
      {
        title: 'Information We Collect',
        body: [
          'We collect account information such as names, email addresses, wedding details, guest names, guest phone numbers, RSVP responses, invitation preferences, and uploaded content that users provide while using VowLink.',
          'When WhatsApp invitation tools are used, we may process phone numbers, invitation links, message delivery status, and message-related metadata needed to send and track invitations.',
        ],
      },
      {
        title: 'How We Use Information',
        body: [
          'We use information to create wedding invitation pages, send invitation messages, collect RSVPs, manage guest lists, provide planning tools, improve product reliability, and communicate important service updates.',
          'We do not sell personal information. Information is shared only with service providers when needed to operate VowLink, such as hosting, database, email, payment, analytics, and messaging providers.',
        ],
      },
      {
        title: 'WhatsApp Communications',
        body: [
          'VowLink may send WhatsApp invitation messages on behalf of couples using approved WhatsApp templates and guest phone numbers supplied by the couple or account owner.',
          'Guests should contact the couple or VowLink if they want their information removed from a wedding guest list or no longer wish to receive invitation communications.',
        ],
      },
      {
        title: 'Data Storage and Security',
        body: [
          'We use reasonable technical and organizational measures to protect account, guest, RSVP, and invitation data from unauthorized access, loss, misuse, or alteration.',
          'No online service can guarantee absolute security, but we limit access to personal information to the systems and people that need it to provide the service.',
        ],
      },
      {
        title: 'Your Choices',
        body: [
          'Users may request access, correction, export, or deletion of personal information associated with their account or event, subject to identity verification and legal or operational limits.',
          'Couples can remove guests from their guest list or update guest details from their VowLink dashboard.',
        ],
      },
      {
        title: 'Contact',
        body: [
          'For privacy requests or data deletion requests, contact VowLink at noreplybiru556@gmail.com.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Terms of Service',
    title: 'VowLink Terms of Service',
    intro:
      'These Terms of Service govern access to and use of VowLink, including wedding invitation pages, RSVP tools, guest management, WhatsApp sending workflows, and related planning features.',
    sections: [
      {
        title: 'Using VowLink',
        body: [
          'Users are responsible for the information they upload, enter, or send through VowLink, including guest details, wedding content, invitation text, images, and RSVP settings.',
          'You must use VowLink lawfully and must not upload harmful content, misuse guest information, attempt unauthorized access, or interfere with the service.',
        ],
      },
      {
        title: 'Guest Information and Consent',
        body: [
          'Couples and account owners are responsible for ensuring they have permission or a lawful basis to add guest contact information and send invitation communications.',
          'WhatsApp messages must comply with WhatsApp Business Platform rules, Meta policies, and applicable privacy, marketing, and communications laws.',
        ],
      },
      {
        title: 'Payments and Plans',
        body: [
          'Some VowLink features may require a paid plan. Plan limits, features, and pricing may change from time to time, but active users will be shown relevant plan information before purchase or upgrade.',
          'Payment processing may be handled by third-party providers, and their terms may also apply to payment transactions.',
        ],
      },
      {
        title: 'Service Availability',
        body: [
          'We work to keep VowLink reliable, but we do not guarantee uninterrupted availability. Features may be updated, paused, or changed to improve the service or meet platform requirements.',
          'VowLink is not responsible for delays or failures caused by third-party platforms, including hosting, email, payment, WhatsApp, Meta, or network providers.',
        ],
      },
      {
        title: 'Limitation of Liability',
        body: [
          'VowLink is provided as a planning and invitation tool. Users are responsible for reviewing invitation details, guest lists, event information, and message content before sharing.',
          'To the maximum extent permitted by law, VowLink is not liable for indirect, incidental, special, or consequential losses arising from use of the service.',
        ],
      },
      {
        title: 'Contact',
        body: [
          'For questions about these terms, contact VowLink at noreplybiru556@gmail.com.',
        ],
      },
    ],
  },
}

const LegalPage = ({ page = 'privacy' }) => {
  const content = pageContent[page] || pageContent.privacy

  return (
    <main className="min-h-screen bg-[#070A13] px-6 py-10 text-white sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src="/vowlink-icon.svg" alt="" className="h-9 w-9 object-contain" />
          <span className="font-serif text-2xl text-white">VowLink</span>
        </Link>

        <section className="mt-14 border-b border-white/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D8B76A]">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">{content.intro}</p>
          <p className="mt-5 text-sm text-white/45">Last updated: {updatedAt}</p>
        </section>

        <div className="divide-y divide-white/10">
          {content.sections.map((section) => (
            <section key={section.title} className="py-9">
              <h2 className="font-serif text-2xl text-white">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-white/60">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-8 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>VowLink digital wedding invitations and RSVP tools.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-[#D8B76A]">Privacy</Link>
            <Link to="/terms" className="hover:text-[#D8B76A]">Terms</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default LegalPage
