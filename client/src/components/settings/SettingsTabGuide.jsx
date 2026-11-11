import { Icon } from "@iconify/react";

export default function SettingsTabGuide ({ guide }) {
  if (!guide) return null;

  return (
    <section className="settings-tab-guide mb-6 rounded-3xl border border-[#D8B76A]/18 bg-[#0D1220]/70 p-4 shadow-2xl shadow-black/10 sm:p-5">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D8B76A]/25 bg-[#D8B76A]/10 text-[#D8B76A]">
            <Icon icon={guide.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">
              {guide.eyebrow}
            </p>
            <h3 className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
              {guide.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              {guide.body}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 2xl:w-[46%]">
          {guide.steps.map((step, index) => (
            <div
              key={step}
              className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:block"
            >
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8B76A]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-xs leading-relaxed text-white/75 sm:mt-2">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {guide.reminder?.trim() && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-500/8 px-3 py-2.5 text-xs leading-relaxed text-emerald-500">
        <Icon icon="lucide:info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{guide.reminder}</span>
      </div>}
    </section>
  );
}
