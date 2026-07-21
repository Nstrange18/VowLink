import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const STORAGE_KEY = "vowlink-venue-visual-guide-seen";

const GUIDE_STEPS = [
  {
    key: "welcome",
    eyebrow: "Step 1",
    title: "Start from your venue workspace",
    body: "This is the control room for your listing. Use it to prepare the venue profile couples will see after VowLink review.",
    action: "Begin with Listing setup.",
  },
  {
    key: "listing",
    eyebrow: "Step 2",
    title: "Complete the listing details",
    body: "Add the venue name, location, capacity, price range, WhatsApp contact, map link, and a clear description of the space.",
    action: "Aim for all profile checks to be complete.",
  },
  {
    key: "photos",
    eyebrow: "Step 3",
    title: "Upload photos that sell the space",
    body: "Couples need to picture the entrance, hall, seating layout, stage area, parking, and best photo angles before they contact you.",
    action: "Use bright, clear photos first.",
  },
  {
    key: "proof",
    eyebrow: "Step 4",
    title: "Add trust and safety proof",
    body: "Upload documents that support the checks you selected, such as safety, security, insurance, or venue ownership proof.",
    action: "Proof helps VowLink review faster.",
  },
  {
    key: "visibility",
    eyebrow: "Step 5",
    title: "Choose how visible the venue should be",
    body: "Basic keeps the venue listed after approval. Priority and Featured help the venue stand out when couples browse options.",
    action: "Upgrade only when you want more reach.",
  },
  {
    key: "inquiries",
    eyebrow: "Step 6",
    title: "Reply when couples show interest",
    body: "After approval, venue inquiries appear in your workspace. Keep replies fast and clear so couples can move from interest to booking.",
    action: "Check inquiries regularly.",
  },
];

const getSceneShell = (key) =>
  `venue-guide-scene venue-guide-scene-${key} relative h-full min-h-[18.75rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#080C17] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[25rem] sm:p-6`;

const renderScene = (key) => {
  if (key === "welcome") {
    return (
      <div className={getSceneShell("welcome")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(216,183,106,0.18),transparent_32%),radial-gradient(circle_at_86%_72%,rgba(16,185,129,0.14),transparent_28%)]" />
        <div className="venue-guide-art venue-guide-art-welcome relative grid h-full gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[#D8B76A]/25 bg-[#0D1220]/90 p-5">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8B76A]/12 text-[#D8B76A]">
                <Icon icon="lucide:building-2" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D8B76A]">Venue</p>
                <p className="mt-1 text-sm font-semibold text-white">Workspace</p>
              </div>
            </div>
            {["Listing setup", "Photos", "Visibility plan", "Inquiries"].map((item, index) => (
              <div key={item} className={`mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${index === 0 ? "border-[#D8B76A]/45 bg-[#D8B76A]/12 text-[#F2D894]" : "border-white/10 bg-white/5 text-white/55"}`}>
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="h-42 rounded-3xl bg-linear-to-br from-[#D8B76A]/30 via-white/10 to-emerald-300/20 p-5">
              <div className="h-full rounded-2xl border border-white/15 bg-[#070A13]/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D8B76A]">Your venue</p>
                <div className="mt-5 h-3 w-48 rounded-full bg-white/70" />
                <div className="mt-3 h-2 w-72 max-w-full rounded-full bg-white/25" />
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-14 rounded-2xl bg-white/12" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[70, 92, 55].map((width) => (
                <div key={width} className="rounded-2xl border border-white/10 bg-[#070A13]/65 p-3">
                  <div className="h-2 rounded-full bg-white/15" />
                  <div className="mt-3 h-2 rounded-full bg-[#D8B76A]/70" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (key === "listing") {
    return (
      <div className={getSceneShell("listing")}>
        <div className="venue-guide-art venue-guide-art-listing grid h-full gap-4 sm:grid-cols-2">
          {["Venue name", "Location", "Capacity", "Price range", "WhatsApp", "Map link"].map((field, index) => (
            <div key={field} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{field}</span>
                <Icon icon={index < 4 ? "lucide:check-circle-2" : "lucide:circle"} className={`h-4 w-4 ${index < 4 ? "text-emerald-300" : "text-[#D8B76A]"}`} />
              </div>
              <div className="h-3 rounded-full bg-white/15" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (key === "photos") {
    return (
      <div className={getSceneShell("photos")}>
        <div className="venue-guide-art venue-guide-art-photos grid h-full grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 row-span-2 rounded-3xl border border-[#D8B76A]/25 bg-linear-to-br from-[#D8B76A]/35 via-white/12 to-[#0D1220] p-5">
            <Icon icon="lucide:image" className="h-8 w-8 text-[#F2D894]" />
            <div className="mt-18 h-3 w-40 rounded-full bg-white/70" />
            <div className="mt-3 h-2 w-56 rounded-full bg-white/25" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="min-h-24 rounded-3xl border border-white/10 bg-white/7 p-3">
              <div className="h-full rounded-2xl bg-linear-to-br from-white/18 to-[#D8B76A]/12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (key === "proof") {
    return (
      <div className={getSceneShell("proof")}>
        <div className="venue-guide-art venue-guide-art-proof mx-auto flex h-full max-w-2xl flex-col justify-center gap-4">
          {["Safety proof", "Ownership or permit", "Security checks"].map((item, index) => (
            <div key={item} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${index === 0 ? "bg-emerald-300/15 text-emerald-200" : "bg-[#D8B76A]/12 text-[#D8B76A]"}`}>
                <Icon icon={index === 0 ? "lucide:shield-check" : "lucide:file-check-2"} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{item}</p>
                <div className="mt-3 h-2 rounded-full bg-white/10" />
              </div>
              <Icon icon="lucide:check" className="h-5 w-5 text-emerald-300" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (key === "visibility") {
    return (
      <div className={getSceneShell("visibility")}>
        <div className="venue-guide-art venue-guide-art-visibility grid h-full content-center gap-3 md:grid-cols-3">
          {[
            ["Basic", "Listed after approval"],
            ["Priority", "Better placement"],
            ["Featured", "Top placement"],
          ].map(([name, detail], index) => (
            <div key={name} className={`rounded-3xl border p-5 ${index === 2 ? "border-[#D8B76A]/45 bg-[#D8B76A]/12" : "border-white/10 bg-white/5"}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D8B76A]">{name}</p>
              <h4 className="mt-4 text-xl font-semibold text-white">{detail}</h4>
              <div className="mt-8 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-2 rounded-full bg-white/15" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={getSceneShell("inquiries")}>
      <div className="venue-guide-art venue-guide-art-inquiries mx-auto flex h-full max-w-2xl flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D8B76A]/12 text-[#D8B76A]">
              <Icon icon="lucide:mail-check" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">New venue inquiry</p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">A couple wants to inspect your venue for their wedding date.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Reply", "Unavailable", "Archive"].map((item, index) => (
              <div key={item} className={`rounded-2xl border px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${index === 0 ? "border-[#D8B76A]/35 bg-[#D8B76A]/12 text-[#F2D894]" : "border-white/10 bg-white/5 text-white/45"}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VenueVisualGuide = ({ open, onClose, autoSaveOnClose = true }) => {
  const [index, setIndex] = useState(0);
  const step = GUIDE_STEPS[index];

  useEffect(() => {
    if (!open) return undefined;
    setIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const finish = () => {
    if (autoSaveOnClose) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose?.();
  };

  const goNext = () => {
    if (index >= GUIDE_STEPS.length - 1) {
      finish();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <div className="venue-visual-guide fixed inset-0 z-80 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#02040A]/85 px-3 py-4 text-white backdrop-blur-md sm:items-center sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Block background actions"
        onClick={(event) => event.preventDefault()}
        onPointerDown={(event) => event.preventDefault()}
        onTouchStart={(event) => event.preventDefault()}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Venue setup guide"
        className="venue-guide-card relative z-10 grid max-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#D8B76A]/25 bg-[#0D1220] shadow-[0_28px_90px_rgba(0,0,0,0.65)] lg:grid-cols-[1.25fr_0.75fr]"
      >
        <div className="venue-guide-visual-panel min-h-0 p-3 sm:p-4 lg:overflow-y-auto lg:p-5">
          {renderScene(step.key)}
        </div>

        <div className="venue-guide-copy flex min-h-0 flex-col border-t border-white/10 bg-[#070A13]/80 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">
                Venue setup guide
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
                {step.eyebrow}
              </p>
            </div>
            <button
              type="button"
              onClick={finish}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label="Close venue setup guide"
            >
              <Icon icon="lucide:x" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex-1">
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
              {step.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/62">
              {step.body}
            </p>
            <div className="mt-5 rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/8 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
                What to do
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-white">
                {step.action}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              {GUIDE_STEPS.map((item, itemIndex) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={`h-1.5 flex-1 rounded-full transition ${itemIndex <= index ? "bg-[#D8B76A]" : "bg-white/10"}`}
                  aria-label={`Go to guide step ${itemIndex + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                disabled={index === 0}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Back
              </button>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
                {index + 1} of {GUIDE_STEPS.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-[#D8B76A] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894]"
              >
                {index >= GUIDE_STEPS.length - 1 ? "Start setup" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export { STORAGE_KEY as VENUE_VISUAL_GUIDE_STORAGE_KEY };
export default VenueVisualGuide;
