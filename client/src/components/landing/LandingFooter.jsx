import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function LandingFooter({ session }) {
  return (
<footer className="landing-footer relative overflow-hidden border-t border-[#D8B76A]/15 bg-[#050814] px-6 py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D8B76A]/70 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-xl -translate-x-1/2 rounded-full bg-[#D8B76A]/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr]">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/10">
                  <img
                    src="/vowlink-icon.svg"
                    alt=""
                    className="h-7 w-7 object-contain"
                  />
                </span>
                <span className="font-serif text-2xl text-white">Vowlink</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Digital wedding invitations, RSVP tracking, guest planning, and
                sharing tools for modern celebrations.
              </p>
              <Link
                to={session ? session.dashboardPath : "/signup"}
                className="mt-6 inline-flex rounded-full bg-[#D8B76A] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:bg-[#F2D894]"
              >
                {session ? session.dashboardLabel : "Start with Classic"}
              </Link>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">
                Explore
              </p>
              <div className="flex flex-col gap-3 text-sm text-white/55">
                <Link
                  to="/features"
                  className="transition hover:text-[#D8B76A]"
                >
                  Features
                </Link>
                <Link
                  to="/templates"
                  className="transition hover:text-[#D8B76A]"
                >
                  Templates
                </Link>
                <Link to="/pricing" className="transition hover:text-[#D8B76A]">
                  Pricing
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">
                Portals
              </p>
              <div className="flex flex-col gap-3 text-sm text-white/55">
                <Link
                  to={session ? session.dashboardPath : "/signup"}
                  className="transition hover:text-[#D8B76A]"
                >
                  {session ? "Return to dashboard" : "Create account"}
                </Link>
                <Link
                  to={session ? session.dashboardPath : "/admin/login"}
                  className="transition hover:text-[#D8B76A]"
                >
                  {session ? "Open workspace" : "Couple login"}
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">
                Legal
              </p>
              <div className="flex flex-col gap-3 text-sm text-white/55">
                <Link to="/privacy" className="transition hover:text-[#D8B76A]">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="transition hover:text-[#D8B76A]">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/3 p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">
                Contact Us
              </p>
              <div className="flex flex-col gap-3 text-sm text-white/60">
                <a
                  href="mailto:hello@vowlink.co"
                  className="group flex items-center gap-3 transition hover:text-[#D8B76A]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="lucide:mail" className="h-4 w-4" />
                  </span>
                  <span>hello@vowlink.co</span>
                </a>
                <a
                  href="https://wa.me/2348050833768"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 transition hover:text-[#D8B76A]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="ri:whatsapp-line" className="h-4 w-4" />
                  </span>
                  <span>+234 805 083 3768</span>
                </a>
                <a
                  href="https://instagram.com/vowlink.co"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 transition hover:text-[#D8B76A]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 text-[#D8B76A] transition group-hover:bg-[#D8B76A] group-hover:text-[#070A13]">
                    <Icon icon="ri:instagram-line" className="h-4 w-4" />
                  </span>
                  <span>@vowlink.co</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p>© {new Date().getFullYear()} Vowlink. All rights reserved.</p>
              <p>VowLink is owned and operated by First and Last Venture.</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link to="/privacy" className="transition hover:text-[#D8B76A]">
                Privacy
              </Link>
              <Link to="/terms" className="transition hover:text-[#D8B76A]">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
  );
}
