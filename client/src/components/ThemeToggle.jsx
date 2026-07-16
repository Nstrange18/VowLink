const ThemeToggle = ({ theme, onToggle }) => {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="fixed right-3 top-3 z-[60] inline-flex h-9 items-center gap-1.5 rounded-full border border-[#D8B76A]/30 bg-[#0D1220]/90 px-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:border-[#D8B76A]/60 sm:right-4 sm:top-4 sm:h-10 sm:gap-2 sm:px-3 max-[420px]:text-[0px] light-theme-toggle"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
          isLight ? "bg-[#070A13] text-white" : "bg-[#D8B76A] text-[#070A13]"
        }`}
      >
        {isLight ? "D" : "L"}
      </span>
      {isLight ? "Dark" : "Light"}
    </button>
  );
};

export default ThemeToggle;
