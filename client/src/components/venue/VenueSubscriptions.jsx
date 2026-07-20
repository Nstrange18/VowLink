const VenueSubscriptions = ({
  venue,
  tier,
  isBasic,
  isListed,
  isFeatured,
  handleInitiateUpgrade,
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#D8B76A]/30 bg-linear-to-b from-[#121829] to-[#0D1220] p-6 sm:p-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#D8B76A] tracking-[0.2em]">Visibility plan</span>
            <h2 className="font-serif text-3xl text-white mt-1 capitalize">{tier} Plan</h2>
            <p className="text-xs text-white/50 mt-2 font-sans">
              {isBasic && "Your venue can appear after approval with the basic listing features."}
              {isListed && "Your venue gets better placement, more photos, and public contact access after approval."}
              {isFeatured && "Your venue gets top placement, a featured badge, and your best photo coverage after approval."}
            </p>
          </div>
          <div className="rounded-full bg-[#D8B76A] text-[#070A13] px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
            {isBasic ? "Free Directory" : "Active Subscription"}
          </div>
        </div>

        {!isBasic && venue?.subscriptionExpiry && (
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/55">
            <span>Next Renewal / Expiry:</span>
            <span className="font-mono text-white font-semibold">{new Date(venue.subscriptionExpiry).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/8 p-4 text-xs leading-relaxed text-white/60">
        <span className="font-bold uppercase tracking-wider text-[#D8B76A]">Approval first:</span>{" "}
        Your listing must pass VowLink review before it appears to couples. A paid plan improves placement after approval.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["More trust", "Show couples a complete, polished venue profile."],
          ["More photos", "Give them enough detail to picture the day."],
          ["More leads", "Make it easier for serious couples to contact you."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8B76A]">{title}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">{copy}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isBasic ? "border-[#D8B76A]/30" : "border-white/10 opacity-70"}`}>
          <div className="space-y-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-white/40">Tier 1</p>
            <h3 className="font-serif text-lg text-white font-semibold">Basic listing</h3>
            <p className="text-2xl font-serif font-bold text-white">NGN 0 <span className="text-xs font-normal text-white/40">/ month</span></p>
            <ul className="space-y-2 text-[10px] text-white/60">
              <li>Appears after checklist and approval</li>
              <li>3 photos</li>
              <li>Good for getting started</li>
            </ul>
          </div>
          <button
            disabled
            className="w-full mt-6 py-2 rounded-xl bg-white/5 text-white/30 text-xs font-semibold uppercase border border-dashed border-white/15"
          >
            {isBasic ? "Current plan" : "Base listing"}
          </button>
        </div>

        <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isListed ? "border-[#D8B76A]/30" : "border-white/10"}`}>
          <div className="space-y-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#D8B76A]">Tier 2 (Recommended)</p>
            <h3 className="font-serif text-lg text-white font-semibold">Priority listing</h3>
            <p className="text-2xl font-serif font-bold text-[#D8B76A]">NGN 20,000 <span className="text-xs font-normal text-white/40">/ month</span></p>
            <ul className="space-y-2 text-[10px] text-white/60">
              <li>Higher placement in venue results</li>
              <li>8 photos</li>
              <li>Direct WhatsApp contact</li>
              <li>Address, pricing, and contact details visible</li>
            </ul>
          </div>
          <button
            onClick={() => handleInitiateUpgrade("listed")}
            disabled={isListed}
            className={`w-full mt-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
              isListed
                ? "bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A]"
                : "bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-[#070A13] cursor-pointer"
            }`}
          >
            {isListed ? "Current plan" : isFeatured ? "Switch to priority" : "Get priority listing"}
          </button>
        </div>

        <div className={`rounded-2xl border p-5 bg-[#0D1220] flex flex-col justify-between ${isFeatured ? "border-[#D8B76A]/30" : "border-white/10"}`}>
          <div className="space-y-3">
            <p className="text-[9px] uppercase font-bold tracking-widest text-amber-400">Tier 3 (Exclusive)</p>
            <h3 className="font-serif text-lg text-white font-semibold">Top placement</h3>
            <p className="text-2xl font-serif font-bold text-amber-400">NGN 50,000 <span className="text-xs font-normal text-white/40">/ month</span></p>
            <ul className="space-y-2 text-[10px] text-white/60">
              <li>Featured placement near the top</li>
              <li>15 photos</li>
              <li>Direct WhatsApp and inquiries</li>
              <li>Featured badge after approval</li>
              <li>Custom tags and website link</li>
            </ul>
          </div>
          <button
            onClick={() => handleInitiateUpgrade("featured")}
            disabled={isFeatured}
            className={`w-full mt-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
              isFeatured
                ? "bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A]"
                : "bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13] hover:opacity-95 cursor-pointer"
            }`}
          >
            {isFeatured ? "Current plan" : "Get top placement"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueSubscriptions;
