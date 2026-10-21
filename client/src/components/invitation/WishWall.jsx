import { Icon } from "@iconify/react";

import { WISHES_PAGE_SIZE } from "../../utils/invitationWishes";

const WishWall = ({
  visibleWishes,
  hasMoreWishes,
  canShowLessWishes,
  setVisibleWishCount,
  wishes,
}) => (
  <section className="invite-section px-4 sm:px-6 py-16 text-center bg-[#070A13] relative z-10 border-t border-white/5 flex flex-col items-center">
    <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">
      Congratulations
    </p>
    <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">
      The Wish Wall
    </h2>
    <p className="text-white/40 text-xs max-w-sm mb-10 -mt-4 leading-relaxed font-normal">
      Beautiful wishes and congratulations from our dear guests who are
      attending.
    </p>

    <div className="w-full max-w-4xl columns-1 gap-6 sm:columns-2 lg:columns-3">
      {visibleWishes.map((w, index) => (
        <div
          key={w._id || `${w.guestName}-${w.createdAt}-${index}`}
          className="invite-feature-card mb-6 inline-block w-full break-inside-avoid p-5 rounded-2xl border border-white/10 bg-[#0D1220] text-left relative overflow-hidden hover:border-[#D8B76A]/40 transition duration-300 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none text-4xl font-serif">
            “
          </div>
          <p className="text-white/80 text-sm leading-relaxed italic mb-4 font-normal">
            "{w.message}"
          </p>
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
            <span className="text-xs text-[#D8B76A] uppercase tracking-wider truncate max-w-28 font-semibold">
              {w.guestName}
            </span>
            <span className="text-[9px] text-white/30">
              {new Date(w.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
    {(hasMoreWishes || canShowLessWishes) && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasMoreWishes && (
          <button
            type="button"
            onClick={() =>
              setVisibleWishCount((count) =>
                Math.min(count + WISHES_PAGE_SIZE, wishes.length),
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8B76A]/35 bg-[#D8B76A]/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8B76A] transition hover:border-[#D8B76A]/70 hover:bg-[#D8B76A]/15"
          >
            Show more wishes
            <Icon icon="lucide:chevron-down" className="h-3.5 w-3.5" />
          </button>
        )}
        {canShowLessWishes && (
          <button
            type="button"
            onClick={() => setVisibleWishCount(WISHES_PAGE_SIZE)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Show less
            <Icon icon="lucide:chevron-up" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )}
  </section>
);

export default WishWall;
