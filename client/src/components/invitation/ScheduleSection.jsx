import { Icon } from "@iconify/react";

const timelineIconAliases = {
  ring: "mdi:ring",
  rings: "mdi:ring",
  church: "mdi:church",
  toast: "mdi:glass-cocktail",
  cocktail: "mdi:glass-cocktail",
  cake: "mdi:cake-variant-outline",
  meal: "mdi:silverware-fork-knife",
  dinner: "mdi:silverware-fork-knife",
  camera: "lucide:camera",
  photo: "lucide:camera",
  music: "lucide:music",
  dance: "mdi:music-note",
};

const resolveTimelineIcon = (icon) => {
  const value = String(icon || "").trim();
  if (!value) return "mdi:ring";
  if (value.includes(":")) return value;
  return timelineIconAliases[value.toLowerCase()] || "mdi:ring";
};

const ScheduleSection = ({
  invitation,
}) => (
  <section className="invite-section px-4 sm:px-6 py-16 text-center bg-[#070A13] relative z-10 border-t border-white/5 flex flex-col items-center download-exclude">
    <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">
      Timeline
    </p>
    <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">
      Wedding Schedule
    </h2>
    <p className="text-white/40 text-xs max-w-sm mb-12 -mt-4 leading-relaxed font-normal">
      Here is what to expect on our special day. We look forward to
      celebrating each moment with you!
    </p>

    <div className="relative w-full max-w-md mx-auto px-4">
      {/* The vertical line */}
      <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-linear-to-b from-[#D8B76A] via-[#F2D894]/50 to-[#D8B76A] opacity-30" />

      <div className="space-y-8 text-left">
        {invitation.userId.timeline.map((event, index) => {
          let displayTime = event.time;
          try {
            const [hourStr, minStr] = event.time.split(":");
            const hour = parseInt(hourStr);
            const period = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            displayTime = `${displayHour}:${minStr} ${period}`;
          } catch (e) {
            // Fallback
          }

          return (
            <div
              key={index}
              className="relative flex items-start pl-14 group"
            >
              {/* Circle Node with icon/emoji */}
              <div className="absolute left-3 top-0 h-10 w-10 rounded-full bg-[#0D1220] border border-[#D8B76A]/40 flex items-center justify-center text-[#D8B76A] shadow-[0_0_15px_rgba(216,183,106,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(216,183,106,0.4)] group-hover:border-[#D8B76A] transition-all duration-300 z-10">
                <Icon
                  icon={resolveTimelineIcon(event.icon)}
                  className="h-5 w-5"
                />
              </div>

              {/* Timeline card details */}
              <div className="invite-feature-card flex-1 p-5 rounded-2xl border border-white/10 bg-[#0D1220] hover:border-[#D8B76A]/30 transition duration-300 shadow-md">
                <span className="text-[10px] font-bold text-[#D8B76A] uppercase tracking-wider block mb-1">
                  {displayTime}
                </span>
                <h4 className="text-white text-base font-semibold font-serif mb-1">
                  {event.title}
                </h4>
                {event.description && (
                  <p className="text-xs text-white/50 leading-relaxed font-normal">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default ScheduleSection;
