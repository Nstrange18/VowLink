import { Link } from "react-router-dom"

const NotFoundPage = () => (
  <section className="flex min-h-screen items-center justify-center bg-[#070A13] text-center px-6">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">404</p>
      <h1 className="font-serif text-5xl text-white mb-4">Not Found</h1>
      <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />
      <p className="text-white/60 text-base">
        This link doesn't exist or may have expired.<br />
        Please check the link you received.
      </p>
      <Link
        to="/"
        className="inline-flex mt-6 items-center gap-2 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-6 py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)]"
      >
        Go to Homepage
      </Link>
    </div>
  </section>
)

export default NotFoundPage
