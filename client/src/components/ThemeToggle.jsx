const ThemeToggle = ({ theme, onToggle }) => {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="fixed right-4 top-4 z-[60] inline-flex h-10 items-center gap-2 rounded-full border border-[#D8B76A]/30 bg-[#0D1220]/90 px-3 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:border-[#D8B76A]/60 light-theme-toggle"
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
