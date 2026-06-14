import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ConfettiShower = () => {
  const colors = ["#D8B76A", "#FAF6F0", "#B76E79", "#FFD1DC", "#CD7F32", "#F7E7CE"];
  
  const pieces = Array.from({ length: 80 }).map((_, i) => {
    const left = `${Math.random() * 100}vw`;
    const size = `${Math.random() * 8 + 6}px`;
    const aspect = Math.random() > 0.5 ? 1 : 0.6;
    const height = `${parseFloat(size) * aspect}px`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = `${Math.random() * 3.5}s`;
    const duration = `${Math.random() * 2.5 + 3.5}s`;
    const drift = `${Math.random() * 200 - 100}px`;
    const isCircle = Math.random() > 0.6;
    
    return {
      id: i,
      style: {
        left,
        width: size,
        height,
        backgroundColor: color,
        animationDelay: delay,
        animationDuration: duration,
        borderRadius: isCircle ? "50%" : "2px",
        "--drift": drift,
      }
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) translateX(var(--drift));
            opacity: 0;
          }
        }
        .confetti-piece {
          position: absolute;
          top: 0;
          pointer-events: none;
          animation: confettiFall 5s linear forwards;
          opacity: 0;
        }
      `}} />
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={p.style} />
      ))}
    </div>
  );
};

const RsvpResponsePage = () => {
  const { state } = useLocation();

  // Debug — shows in browser DevTools Console
  console.log("[RsvpResponsePage] state received:", state);

  const partner1 = state?.partner1Name || "";
  const partner2 = state?.partner2Name || "";
  const coupleName =
    partner1 && partner2 ? `${partner1} & ${partner2}` : "The Couple";
  const weddingDate = formatDate(state?.weddingDate);

  // "Yes" = attending, "No" = declined, undefined = direct URL visit
  const attending = state?.attending;
  const isAttending = attending !== "No";

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg.png')] bg-cover bg-top bg-no-repeat px-6">
      {isAttending && <ConfettiShower />}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1 bg-[#070A13] rounded-full py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm text-[#D8B76A] hover:text-[#D8B76A]/70 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] transition whitespace-nowrap"
      >
        <span>←</span>
        <span className="hidden sm:inline">View the landing page</span>
        <span className="sm:hidden">Landing page</span>
      </Link>
      <div className="w-full max-w-lg rounded-[28px] border border-[#D8B76A]/40 bg-[#070A13]/80 px-8 py-14 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D8B76A]/50 bg-[#D8B76A]/10">
          <span className="text-2xl text-[#D8B76A]">
            {isAttending ? "✓" : "✕"}
          </span>
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#D8B76A]">
          RSVP {isAttending ? "Received" : "Updated"}
        </p>

        <h1 className="font-serif text-4xl font-normal text-white sm:text-5xl">
          {isAttending ? "Thank You!" : "We'll Miss You"}
        </h1>

        <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />

        <p className="mx-auto max-w-sm text-base leading-7 text-white/70">
          {isAttending ? (
            <>
              Your RSVP has been received.{" "}
              {weddingDate ? (
                <>
                  We're so excited to celebrate with you on{" "}
                  <span className="text-[#D8B76A]">{weddingDate}</span>.
                </>
              ) : (
                "We're so excited to celebrate with you!"
              )}
            </>
          ) : (
            "We have received your response and will miss having you with us to celebrate."
          )}
        </p>

        <p className="mt-6 text-sm text-white/40">{coupleName}</p>

        {/* Cash Gifting panel */}
        {isAttending && state?.registryEnabled && (
          <div className="mt-8 pt-6 border-t border-white/10 text-left space-y-4">
            <h3 className="font-serif text-lg text-white text-center tracking-wide">🎁 Gift Registry</h3>
            {state?.registryNotes && (
              <p className="text-xs text-white/60 text-center leading-relaxed italic">
                "{state.registryNotes}"
              </p>
            )}

            {/* Bank details card */}
            {state?.registryAccountNumber && (
              <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none text-5xl select-none">🏦</div>
                <p className="text-[10px] uppercase tracking-wider text-[#D8B76A] font-bold">Bank Transfer Info</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Bank</span>
                    <span className="text-white font-medium">{state.registryBankName || "Not Specified"}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Account Name</span>
                    <span className="text-white font-medium">{state.registryAccountName || "Not Specified"}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-white/5 rounded-lg p-2.5 mt-1 border border-white/5">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Account Number</span>
                      <span className="text-white font-mono text-sm tracking-wide font-bold">{state.registryAccountNumber}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(state.registryAccountNumber);
                        toast.success("Account number copied! 📋");
                      }}
                      className="px-2.5 py-1.5 rounded-md bg-[#D8B76A] text-[#070A13] text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default RsvpResponsePage;
