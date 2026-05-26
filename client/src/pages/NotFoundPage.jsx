const NotFoundPage = () => (
  <section className="flex min-h-screen items-center justify-center bg-[#070A13] text-center px-6">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">404</p>
      <h1 className="font-serif text-5xl text-white mb-4">Invitation Not Found</h1>
      <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />
      <p className="text-white/60 text-base">
        This invitation link doesn't exist or may have expired.<br />
        Please check the link you received.
      </p>
    </div>
  </section>
)

export default NotFoundPage
