const CountdownBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="invite-countdown-box rounded-xl border border-[#D8B76A]/30 bg-[#D8B76A]/10 px-3 py-2 min-w-13 text-center">
      <span className="invite-countdown-number font-serif text-2xl font-light text-white">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="invite-countdown-label mt-1 text-[9px] uppercase tracking-widest text-[#D8B76A]/70">
      {label}
    </span>
  </div>
);

const Countdown = ({
  countdown,
  scale,
}) => (
  <div
    className="w-full download-exclude"
    style={{ maxWidth: `${608 * scale}px` }}
  >
    <p className="invite-countdown-heading text-center text-xs uppercase tracking-[0.25em] text-[#D8B76A] mb-3">
      Counting Down
    </p>
    <div className="flex items-end justify-center gap-2">
      <CountdownBox value={countdown.days} label="Days" />
      <span className="invite-countdown-separator mb-4 text-[#D8B76A] font-light text-xl">
        :
      </span>
      <CountdownBox value={countdown.hours} label="Hours" />
      <span className="invite-countdown-separator mb-4 text-[#D8B76A] font-light text-xl">
        :
      </span>
      <CountdownBox value={countdown.minutes} label="Mins" />
      <span className="invite-countdown-separator mb-4 text-[#D8B76A] font-light text-xl">
        :
      </span>
      <CountdownBox value={countdown.seconds} label="Secs" />
    </div>
  </div>
);

export default Countdown;
