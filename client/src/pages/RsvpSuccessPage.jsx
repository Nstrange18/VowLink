import { useLocation } from 'react-router-dom'

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const RsvpSuccessPage = () => {
  const { state } = useLocation()
  const partner1 = state?.partner1Name || ''
  const partner2 = state?.partner2Name || ''
  const coupleName = partner1 && partner2 ? `${partner1} & ${partner2}` : 'The Couple'
  const weddingDate = formatDate(state?.weddingDate)

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg.png')] bg-cover bg-top bg-no-repeat px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-[#D8B76A]/40 bg-[#070A13]/80 px-8 py-14 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D8B76A]/50 bg-[#D8B76A]/10">
          <span className="text-2xl text-[#D8B76A]">✓</span>
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#D8B76A]">
          RSVP Received
        </p>

        <h1 className="font-serif text-4xl font-normal text-white sm:text-5xl">
          Thank You!
        </h1>

        <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />

        <p className="mx-auto max-w-sm text-base leading-7 text-white/70">
          Your RSVP has been received.{' '}
          {weddingDate ? (
            <>
              We're so excited to celebrate with you on{' '}
              <span className="text-[#D8B76A]">{weddingDate}</span>.
            </>
          ) : (
            "We're so excited to celebrate with you!"
          )}
        </p>

        <p className="mt-6 text-sm text-white/40">{coupleName}</p>
      </div>
    </section>
  )
}

export default RsvpSuccessPage
