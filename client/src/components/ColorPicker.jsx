import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";

export const WEDDING_COLORS = [
  { name: "Ivory", hex: "#FFFFF0", tags: ["neutral", "pastel"], aliases: ["warm ivory"] },
  { name: "Champagne Gold", hex: "#C9A84C", tags: ["warm", "metallic"], aliases: ["champagne", "luxury"] },
  { name: "Beige", hex: "#D8C7A3", tags: ["neutral", "earthy"], aliases: ["champagne", "soft"] },
  { name: "Warm Ivory", hex: "#F4E8CF", tags: ["neutral", "pastel"], aliases: ["champagne", "soft"] },
  { name: "Blush Pink", hex: "#FFB6C1", tags: ["warm", "pastel"], aliases: ["soft", "romantic"] },
  { name: "Dusty Rose", hex: "#DCAE96", tags: ["warm", "pastel"], aliases: ["burgundy", "rose"] },
  { name: "Sage Green", hex: "#8FAF88", tags: ["cool", "earthy", "pastel"], aliases: ["earthy", "soft"] },
  { name: "Lavender", hex: "#B57EDC", tags: ["cool", "pastel"], aliases: ["soft"] },
  { name: "Navy Blue", hex: "#1A2E4A", tags: ["cool", "bold", "dark"], aliases: ["blue", "luxury"] },
  { name: "Royal Blue", hex: "#2B4D9C", tags: ["cool", "bold"], aliases: ["blue"] },
  { name: "Powder Blue", hex: "#B7D7EA", tags: ["cool", "pastel"], aliases: ["blue", "soft"] },
  { name: "Sky Blue", hex: "#87CEEB", tags: ["cool", "pastel"], aliases: ["blue"] },
  { name: "Burgundy", hex: "#800020", tags: ["warm", "bold", "dark"], aliases: ["wine", "maroon", "merlot", "luxury"] },
  { name: "Deep Burgundy", hex: "#5E0B22", tags: ["warm", "bold", "dark"], aliases: ["burgundy", "wine", "luxury"] },
  { name: "Wine", hex: "#722F37", tags: ["warm", "bold", "dark"], aliases: ["burgundy", "merlot"] },
  { name: "Maroon", hex: "#800000", tags: ["warm", "bold", "dark"], aliases: ["burgundy", "wine"] },
  { name: "Merlot", hex: "#73343A", tags: ["warm", "bold", "dark"], aliases: ["burgundy", "wine"] },
  { name: "Plum", hex: "#673147", tags: ["cool", "bold", "dark"], aliases: ["burgundy", "wine", "luxury"] },
  { name: "Terracotta", hex: "#C27B5A", tags: ["warm", "earthy"], aliases: ["earthy"] },
  { name: "Emerald Green", hex: "#2D6A4F", tags: ["cool", "bold", "dark"], aliases: ["luxury"] },
  { name: "Mint Green", hex: "#AAD5C0", tags: ["cool", "pastel"], aliases: ["soft"] },
  { name: "Peach", hex: "#FFCBA4", tags: ["warm", "pastel", "earthy"], aliases: ["soft", "earthy"] },
  { name: "Coral", hex: "#FF7F6A", tags: ["warm", "bold"], aliases: [] },
  { name: "Gold", hex: "#D4AF37", tags: ["warm", "metallic", "bold"], aliases: ["luxury"] },
  { name: "Silver", hex: "#C0C0C0", tags: ["cool", "metallic", "neutral"], aliases: [] },
  { name: "White", hex: "#FFFFFF", tags: ["neutral"], aliases: [] },
  { name: "Cream", hex: "#FFFDD0", tags: ["neutral", "pastel", "earthy"], aliases: ["soft", "earthy"] },
  { name: "Mauve", hex: "#C5A0A0", tags: ["pastel", "neutral"], aliases: ["soft"] },
  { name: "Teal", hex: "#008080", tags: ["cool", "bold"], aliases: ["blue"] },
  { name: "Lilac", hex: "#C8A2C8", tags: ["cool", "pastel"], aliases: ["soft"] },
  { name: "Nude", hex: "#E8C9A0", tags: ["neutral", "earthy", "pastel"], aliases: ["champagne", "soft"] },
  { name: "Midnight Black", hex: "#1C1C1C", tags: ["neutral", "bold", "dark"], aliases: ["luxury", "dark elegant"] },
  { name: "Rose Gold", hex: "#B76E79", tags: ["warm", "metallic"], aliases: ["champagne", "burgundy", "luxury"] },
];

export const RECOMMENDED_WEDDING_PALETTES = [
  ["Champagne Gold", "Ivory", "Midnight Black"],
  ["Burgundy", "Blush Pink", "Gold"],
  ["Sage Green", "Cream", "Nude"],
  ["Royal Blue", "Silver", "White"],
  ["Terracotta", "Peach", "Cream"],
  ["Emerald Green", "Gold", "Ivory"],
];

const FILTERS = ["Warm", "Cool", "Neutral", "Bold", "Pastel", "Metallic", "Earthy"];
const ROLES = ["Primary", "Secondary", "Accent"];
const HEX_RE = /^#[0-9A-F]{6}$/i;
const RECENT_KEY = "vowlink_recent_custom_colours";
const COLOUR_PAGE_SIZE = 10;

const SIMILAR_SHADE_MAP = {
  Burgundy: ["Deep Burgundy", "Wine", "Plum", "Dusty Rose", "Rose Gold"],
  "Champagne Gold": ["Beige", "Warm Ivory", "Nude", "Rose Gold"],
  "Royal Blue": ["Navy Blue", "Powder Blue", "Teal", "Sky Blue"],
};

const QUERY_TAGS = [
  { terms: ["something soft", "soft", "gentle", "subtle"], tag: "pastel" },
  { terms: ["luxury colours", "luxury colors", "luxury", "dark elegant", "elegant"], tag: "dark" },
  { terms: ["earthy", "earth", "natural"], tag: "earthy" },
  { terms: ["wine", "maroon", "merlot"], tag: "burgundy" },
  { terms: ["champagne"], tag: "champagne" },
  { terms: ["blue"], tag: "blue" },
];

export const isHexColor = (value) => HEX_RE.test(String(value || "").trim());

export const getWeddingColorHex = (value) => {
  if (isHexColor(value)) return value.toUpperCase();
  return WEDDING_COLORS.find((color) => color.name === value)?.hex || "#999999";
};

export const normalizeWeddingColors = (colors = []) =>
  (Array.isArray(colors) ? colors : [])
    .filter((color) => typeof color === "string" && color.trim())
    .slice(0, 3);

const getColorMeta = (value) => {
  const known = WEDDING_COLORS.find((color) => color.name === value);
  if (known) return known;
  if (isHexColor(value)) {
    return { name: value.toUpperCase(), hex: value.toUpperCase(), tags: ["custom"], aliases: [] };
  }
  return { name: value || "Not selected", hex: "#999999", tags: [], aliases: [] };
};

const luminance = (hex) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;
  const values = [0, 2, 4].map((start) => {
    const channel = parseInt(clean.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};

const contrastRatio = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};

const readableTextColor = (background) =>
  contrastRatio(background, "#070A13") >= contrastRatio(background, "#FFFFFF")
    ? "#070A13"
    : "#FFFFFF";

const shadeHex = (hex, amount) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const next = [0, 2, 4]
    .map((start) => {
      const value = parseInt(clean.slice(start, start + 2), 16);
      const adjusted = Math.max(0, Math.min(255, value + amount));
      return adjusted.toString(16).padStart(2, "0");
    })
    .join("");
  return `#${next}`.toUpperCase();
};

const getStoredRecent = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isHexColor).slice(0, 8) : [];
  } catch {
    return [];
  }
};

const storeRecent = (hex) => {
  const recent = [hex.toUpperCase(), ...getStoredRecent().filter((item) => item !== hex.toUpperCase())].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  return recent;
};

const ColorSwatchButton = ({ color, active, disabled, onClick, label }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    title={color.name}
    className={`colour-picker-swatch group relative min-w-0 rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
      active
        ? "border-[#D8B76A] bg-[#D8B76A]/15 ring-1 ring-[#D8B76A]/40"
        : disabled
          ? "cursor-not-allowed border-white/5 opacity-35"
          : "border-white/10 bg-white/5 hover:border-[#D8B76A]/35 hover:bg-white/10"
    }`}
  >
    <span
      className="block h-12 w-full rounded-xl border border-black/10 shadow-inner sm:h-14"
      style={{ background: color.hex }}
    />
    <span className="mt-2 block text-[10px] font-semibold leading-snug text-white/75">
      {label || color.name}
    </span>
    {active && (
      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D8B76A] text-[#070A13]">
        <Icon icon="lucide:check" className="h-3 w-3" />
      </span>
    )}
  </button>
);

const ColorPicker = ({
  value = [],
  onChange,
  textColor = "#1A2E4A",
  onUseRecommendedTextColor,
  showSaveAction = true,
}) => {
  const selected = normalizeWeddingColors(value);
  const [activeRole, setActiveRole] = useState(0);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showAllColors, setShowAllColors] = useState(false);
  const [visibleColorCount, setVisibleColorCount] = useState(COLOUR_PAGE_SIZE);
  const [customHex, setCustomHex] = useState("#C9A84C");
  const [brightness, setBrightness] = useState(0);
  const [customPreviewHex, setCustomPreviewHex] = useState("#C9A84C");
  const [recentColours, setRecentColours] = useState([]);

  useEffect(() => {
    setRecentColours(getStoredRecent());
  }, []);

  useEffect(() => {
    if (isHexColor(customHex)) {
      setCustomPreviewHex(shadeHex(customHex, Number(brightness)));
    }
  }, [customHex, brightness]);

  useEffect(() => {
    if (query.trim()) setShowAllColors(true);
  }, [query]);

  useEffect(() => {
    setVisibleColorCount(COLOUR_PAGE_SIZE);
  }, [activeFilter, query]);

  const primaryHex = getWeddingColorHex(selected[0]);
  const recommendedText = readableTextColor(primaryHex);
  const activeContrast = contrastRatio(primaryHex, isHexColor(textColor) ? textColor : recommendedText);
  const hasPoorContrast = activeContrast < 4.5;

  const updateSlot = (slot, colorName) => {
    const next = [...selected];
    const safeSlot = Math.min(Math.max(slot, 0), next.length, 2);
    next[safeSlot] = colorName;
    onChange(next.filter(Boolean).slice(0, 3));
  };

  const toggleNamedColor = (name) => {
    const existingIndex = selected.indexOf(name);
    if (existingIndex >= 0) {
      onChange(selected.filter((item) => item !== name));
      setActiveRole(Math.max(0, Math.min(existingIndex, 2)));
      return;
    }
    const slot = selected[activeRole] ? selected.findIndex((item) => !item) : activeRole;
    updateSlot(slot >= 0 ? slot : activeRole, name);
  };

  const queryTag = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return "";
    return QUERY_TAGS.find((entry) =>
      entry.terms.some((term) => normalized.includes(term)),
    )?.tag || "";
  }, [query]);

  const filteredColors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filterTag = activeFilter.toLowerCase();
    return WEDDING_COLORS.filter((color) => {
      const searchable = [color.name, ...(color.aliases || []), ...(color.tags || [])]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        !normalized ||
        searchable.includes(normalized) ||
        (queryTag && searchable.includes(queryTag));
      const matchesFilter = !filterTag || color.tags?.includes(filterTag);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, queryTag]);
  const visibleColors = filteredColors.slice(0, visibleColorCount);
  const hasMoreColors = visibleColorCount < filteredColors.length;

  const similarShades = useMemo(() => {
    const current = selected[activeRole] || selected[selected.length - 1];
    const meta = getColorMeta(current);
    const mapped = SIMILAR_SHADE_MAP[meta.name] || WEDDING_COLORS
      .filter((color) => color.name !== meta.name && color.tags?.some((tag) => meta.tags?.includes(tag)))
      .slice(0, 5)
      .map((color) => color.name);
    return mapped
      .map((name) => WEDDING_COLORS.find((color) => color.name === name))
      .filter(Boolean);
  }, [activeRole, selected]);

  const confirmCustom = () => {
    if (!isHexColor(customPreviewHex)) return;
    updateSlot(activeRole, customPreviewHex.toUpperCase());
    setRecentColours(storeRecent(customPreviewHex));
  };

  return (
    <section id="colours-style" data-section="colours" className="colour-picker space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#D8B76A]">
            Colours of the day
          </p>
          <h3 className="mt-1 font-serif text-2xl text-white">Colours & Style</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">
            Choose up to three confirmed shades. Typed descriptions only guide the swatches shown here.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-2 sm:w-auto sm:min-w-44">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/10">
            {ROLES.map((role, index) => (
              <span
                key={role}
                className="h-11 min-w-0 border-r border-black/10 last:border-r-0"
                title={`${role}: ${selected[index] || "Not selected"}`}
                style={{ background: selected[index] ? getWeddingColorHex(selected[index]) : "rgba(255,255,255,0.05)" }}
              />
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] font-semibold text-white/45">
            {selected.length} of 3 selected
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block rounded-2xl border border-white/10 bg-white/5 p-3 transition focus-within:border-[#D8B76A]/50 focus-within:bg-white/8">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
            Search colours
          </span>
          <span className="relative block">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try wine, champagne, luxury, earthy, something soft..."
              className="colour-picker-input w-full rounded-xl border border-white/10 bg-[#070A13]/80 py-3 pl-10 pr-4 text-sm text-white placeholder-white/35 outline-none transition focus:border-[#D8B76A]/60"
            />
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
            {query ? `${filteredColors.length} matching visual shades` : "Typing filters the swatches below. It never saves text by itself."}
            {queryTag && (
              <span className="rounded-full border border-[#D8B76A]/25 bg-[#D8B76A]/10 px-2 py-1 font-bold uppercase tracking-wider text-[#D8B76A]">
                {queryTag}
              </span>
            )}
          </span>
        </label>

        <div className="rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/8 p-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
            <Icon icon="lucide:pipette" className="h-3.5 w-3.5" />
            Custom colour
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_minmax(8rem,1fr)_auto] sm:items-center">
            <input
              type="color"
              aria-label="Custom colour picker"
              value={isHexColor(customHex) ? customHex : "#C9A84C"}
              onChange={(event) => setCustomHex(event.target.value.toUpperCase())}
              className="h-11 w-full cursor-pointer rounded-xl border border-white/15 bg-transparent p-1 sm:w-14"
            />
            <input
              value={customHex}
              onChange={(event) => setCustomHex(event.target.value.toUpperCase())}
              placeholder="#C9A84C"
              className="colour-picker-input min-w-0 rounded-xl border border-white/10 bg-[#070A13]/70 px-3 py-3 text-sm font-bold uppercase text-white outline-none focus:border-[#D8B76A]/60"
            />
            <button
              type="button"
              disabled={!isHexColor(customHex)}
              onClick={confirmCustom}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D8B76A] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm custom
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Brightness</span>
              <input
                type="range"
                min="-80"
                max="80"
                value={brightness}
                onChange={(event) => setBrightness(event.target.value)}
                className="w-full accent-[#D8B76A]"
              />
            </label>
            <div className="grid grid-cols-[2.75rem_1fr] items-center gap-2 sm:flex">
              <span className="h-11 w-11 rounded-xl border border-white/15" style={{ background: customPreviewHex }} />
              <span className="min-w-0 rounded-xl border border-white/10 bg-[#070A13]/45 px-3 py-2 text-xs font-bold uppercase text-white/70">
                {customPreviewHex}
              </span>
            </div>
          </div>
          {!isHexColor(customHex) && (
            <p className="mt-2 text-[10px] font-semibold text-red-300">Enter a valid 6-digit hex code, for example #C9A84C.</p>
          )}
          {recentColours.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Recently used</span>
              {recentColours.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setCustomHex(hex);
                    updateSlot(activeRole, hex);
                  }}
                  title={hex}
                  className="h-7 w-7 rounded-full border border-white/20"
                  style={{ background: hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
            Popular wedding palettes
          </h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {RECOMMENDED_WEDDING_PALETTES.map((palette) => (
            <button
              key={palette.join("-")}
              type="button"
              onClick={() => onChange(palette)}
              className="group rounded-2xl border border-white/10 bg-[#070A13]/55 p-3 text-left transition hover:border-[#D8B76A]/45 hover:bg-[#D8B76A]/10 active:scale-[0.99]"
            >
              <div className="flex overflow-hidden rounded-xl border border-white/10">
                {palette.map((name) => (
                  <span key={name} className="h-10 flex-1" style={{ background: getWeddingColorHex(name) }} />
                ))}
              </div>
              <p className="mt-2 text-[10px] font-semibold text-white/65">{palette.join(", ")}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <button
              type="button"
              onClick={() => setShowAllColors((open) => !open)}
              className="flex w-full items-center justify-between gap-3 text-left sm:pointer-events-none"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">All colours</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/45 sm:hidden">
                {showAllColors ? "Hide" : "Show"}
                <Icon icon={showAllColors ? "lucide:chevron-up" : "lucide:chevron-down"} className="h-3 w-3" />
              </span>
            </button>
            <div className={`${showAllColors ? "block" : "hidden"} mt-3 space-y-3 sm:block`}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter("")}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    !activeFilter ? "border-[#D8B76A] bg-[#D8B76A] text-[#070A13]" : "border-white/10 bg-white/5 text-white/55"
                  }`}
                >
                  All
                </button>
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                      activeFilter === filter ? "border-[#D8B76A] bg-[#D8B76A] text-[#070A13]" : "border-white/10 bg-white/5 text-white/55 hover:border-[#D8B76A]/35"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {query && (
                <p className="text-[10px] text-white/45">
                  Showing visual swatches for "{query}". Select a shade to save it.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {visibleColors.map((color) => (
                  <ColorSwatchButton
                    key={color.name}
                    color={color}
                    active={selected.includes(color.name)}
                    onClick={() => toggleNamedColor(color.name)}
                  />
                ))}
              </div>
              {filteredColors.length > COLOUR_PAGE_SIZE && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleColorCount((count) =>
                        hasMoreColors
                          ? Math.min(count + COLOUR_PAGE_SIZE, filteredColors.length)
                          : COLOUR_PAGE_SIZE,
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8B76A]/25 bg-[#D8B76A]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D8B76A] transition hover:bg-[#D8B76A] hover:text-[#070A13]"
                  >
                    {hasMoreColors ? "Show more colours" : "Show less colours"}
                    <Icon icon={hasMoreColors ? "lucide:chevron-down" : "lucide:chevron-up"} className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {filteredColors.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
                  No saved colour matches that phrase. Try a broader word like soft, luxury, blue, or earthy.
                </p>
              )}
            </div>
          </div>

          {similarShades.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
                Similar shades
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {similarShades.map((color) => (
                  <ColorSwatchButton
                    key={color.name}
                    color={color}
                    active={selected.includes(color.name)}
                    onClick={() => toggleNamedColor(color.name)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3 rounded-2xl border border-[#D8B76A]/20 bg-[#101624]/95 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">
            Selected colours - {selected.length} of 3
          </h4>
          <div className="space-y-2">
            {ROLES.map((role, index) => {
              const meta = getColorMeta(selected[index]);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(index)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                    activeRole === index ? "border-[#D8B76A]/60 bg-[#D8B76A]/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <span className="h-8 w-8 shrink-0 rounded-lg border border-white/15" style={{ background: meta.hex }} />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">{role}</span>
                    <span className="block truncate text-xs font-semibold text-white/75">{selected[index] || "Choose colour"}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10" style={{ background: primaryHex }}>
            <div className="p-4" style={{ color: recommendedText }}>
              <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">Preview invitation colours</p>
              <p className="mt-2 font-serif text-2xl">Allen & Justina</p>
              <div className="mt-3 flex gap-2">
                {selected.map((item, index) => (
                  <span key={`${item}-preview-${index}`} className="h-5 w-5 rounded-full border border-black/10" style={{ background: getWeddingColorHex(item) }} />
                ))}
              </div>
            </div>
          </div>
          {hasPoorContrast && (
            <div className="rounded-xl border border-red-300/25 bg-red-500/10 p-3 text-[10px] leading-relaxed text-red-200">
              This text/background combination may be hard to read.
            </div>
          )}
          <button
            type="button"
            onClick={() => onUseRecommendedTextColor?.(recommendedText)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70 transition hover:border-[#D8B76A]/35 hover:text-[#D8B76A]"
          >
            <Icon icon="lucide:wand-sparkles" className="h-3.5 w-3.5" />
            Use recommended text colour ({recommendedText})
          </button>
          {showSaveAction && (
            <button
              type="submit"
              form="settings-customization-form"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D8B76A] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894]"
            >
              <Icon icon="lucide:save" className="h-3.5 w-3.5" />
              Save colours
            </button>
          )}
        </aside>
      </div>
    </section>
  );
};

export default ColorPicker;
