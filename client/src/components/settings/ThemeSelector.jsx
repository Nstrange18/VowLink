import React, { useState } from "react";
import { toast } from "react-toastify";
import ColorPicker from "../ColorPicker";
import { useSettings } from "../../context/SettingsContext";
import { getTemplateLayout } from "../../utils/templateLayouts";

export const THEMES = [
  { value: "floral", label: "Classic Floral (Free / All plans)" },
  { value: "minimalist", label: "Modern Minimalist (Plus / Pro)" },
  { value: "navy", label: "Royal Navy & Gold (Plus / Pro)" },
  { value: "stardust", label: "Animated Stardust (Pro Only)" },
  { value: "forest", label: "Animated Whimsical Forest (Pro Only)" },
  { value: "custom", label: "Upload Custom Card Image (Pro Only)" },
];

export const FONTS = [
  { value: "classic", label: "Serif & Script Hybrid" },
  { value: "serif", label: "Formal Elegant Serif" },
  { value: "script", label: "Romantic Handwritten Script" },
  { value: "modern", label: "Clean Modern Sans-Serif" },
];

export const PREMADE_TEMPLATES = [
  {
    tier: "plus",
    name: "Classic Navy, Gold & Cream",
    url: "/templates/template_free_1.png",
    preview: "/templates/template_free_1.png",
  },
  {
    tier: "free",
    name: "Blush Pink Watercolor",
    url: "/templates/Blush Pink Watercolor.png",
    preview: "/templates/Blush Pink Watercolor.png",
  },
  {
    tier: "free",
    name: "Cream Floral Elegance",
    url: "/templates/Cream Floral Elegance.png",
    preview: "/templates/Cream Floral Elegance.png",
  },
  {
    tier: "plus",
    name: "Emerald Eucalyptus Frame",
    url: "/templates/Emerald Eucalyptus Frame.png",
    preview: "/templates/Emerald Eucalyptus Frame.png",
  },
  {
    tier: "plus",
    name: "Royal Navy Gold Frame",
    url: "/templates/elegant_gold_frame_with_navy_backdrop.png",
    preview: "/templates/elegant_gold_frame_with_navy_backdrop.png",
  },
  {
    tier: "plus",
    name: "Royal Navy Lace Accent",
    url: "/templates/Royal Navy Lace Accent.png",
    preview: "/templates/Royal Navy Lace Accent.png",
  },
  {
    tier: "plus",
    name: "Elegant Purple & Silver Floral",
    url: "/templates/Elegant purple and silver floral.png",
    preview: "/templates/Elegant purple and silver floral.png",
  },
  {
    tier: "pro",
    name: "Midnight Black Floral",
    url: "/templates/template_plus_3.png",
    preview: "/templates/template_plus_3.png",
  },
  {
    tier: "pro",
    name: "Deep Black Rose",
    url: "/templates/Midnight Black Floral2.png",
    preview: "/templates/Midnight Black Floral2.png",
  },
  {
    tier: "pro",
    name: "Dark Black Gold Marble",
    url: "/templates/Dark Black Gold Marble.png",
    preview: "/templates/Dark Black Gold Marble.png",
  },
  {
    tier: "pro",
    name: "Burgundy Velvet Filigree",
    url: "/templates/Burgundy Velvet Filigree.png",
    preview: "/templates/Burgundy Velvet Filigree.png",
  },
  {
    tier: "pro",
    name: "Royal Emerald Gold Frame",
    url: "/templates/Royal Emerald Gold Frame.png",
    preview: "/templates/Royal Emerald Gold Frame.png",
  },
  {
    tier: "pro",
    name: "Blush Pink & Rose Gold Glitter",
    url: "/templates/Blush Pink & Rose Gold Glitter.png",
    preview: "/templates/Blush Pink & Rose Gold Glitter.png",
  },
  {
    tier: "pro",
    name: "Minimalist Linen Ivory Leaves",
    url: "/templates/template_pro_5.png",
    preview: "/templates/template_pro_5.png",
  },
  {
    tier: "pro",
    name: "Starry Lavender Gold Dust",
    url: "/templates/template_pro_6.png",
    preview: "/templates/template_pro_6.png",
  },
  {
    tier: "pro",
    name: "Classic Charcoal Gold Floral",
    url: "/templates/template_pro_7.png",
    preview: "/templates/template_pro_7.png",
  },
];

const getTemplatePreviewStyles = (url) => {
  return { background: `url('${url}') center/cover no-repeat` };
};

const renderTemplatePreviewOrnaments = (url) => {
  return null;
};

const ThemeSelector = () => {
  const {
    cardTheme,
    setCardTheme,
    customCardBg,
    setCustomCardBg,
    customTextColor,
    setCustomTextColor,
    customFontFamily,
    setCustomFontFamily,
    customVerticalOffset,
    setCustomVerticalOffset,
    customHorizontalOffset,
    setCustomHorizontalOffset,
    customTextSize,
    setCustomTextSize,
    customTextSizeTitle,
    setCustomTextSizeTitle,
    customTextSizeSubtitle,
    setCustomTextSizeSubtitle,
    customTextSizeCoupleNames,
    setCustomTextSizeCoupleNames,
    customTextSizeGreeting,
    setCustomTextSizeGreeting,
    customTextSizeMessage,
    setCustomTextSizeMessage,
    customTextSizeDetails,
    setCustomTextSizeDetails,
    customTextSizeReception,
    setCustomTextSizeReception,
    customTextSizeColors,
    setCustomTextSizeColors,
    customTextBoldness,
    setCustomTextBoldness,
    customTextAlign,
    setCustomTextAlign,
    setUserHasCustomAlignment,
    userHasCustomTextColor,
    setUserHasCustomTextColor,
    weddingColors,
    setWeddingColors,
    isFree,
    isPlus,
    isPro,
    tier,
    customBgInputRef,
    handleCustomCardBgUpload,
    getSmartTextColor,
    checkSmartAlignment,
    secHex,
  } = useSettings();

  const [showDetailedScaling, setShowDetailedScaling] = useState(false);
  const [showThemeLayout, setShowThemeLayout] = useState(true);
  const [showFineTuning, setShowFineTuning] = useState(true);

  const hasThemeChanges =
    cardTheme !== "floral" ||
    customCardBg !== "" ||
    customTextColor !== "#1A2E4A" ||
    customFontFamily !== "classic" ||
    customVerticalOffset !== 0 ||
    customHorizontalOffset !== 0 ||
    customTextSize !== 1.0 ||
    customTextSizeTitle !== 1.0 ||
    customTextSizeSubtitle !== 1.0 ||
    customTextSizeCoupleNames !== 1.0 ||
    customTextSizeGreeting !== 1.0 ||
    customTextSizeMessage !== 1.0 ||
    customTextSizeDetails !== 1.0 ||
    customTextSizeReception !== 1.0 ||
    customTextSizeColors !== 1.0 ||
    customTextBoldness !== "normal" ||
    customTextAlign !== "center";

  const handleResetTheme = () => {
    setCardTheme("floral");
    setCustomCardBg("");
    setCustomTextColor("#1A2E4A");
    setCustomFontFamily("classic");
    setCustomVerticalOffset(0);
    setCustomHorizontalOffset(0);
    setCustomTextSize(1.0);
    setCustomTextSizeTitle(1.0);
    setCustomTextSizeSubtitle(1.0);
    setCustomTextSizeCoupleNames(1.0);
    setCustomTextSizeGreeting(1.0);
    setCustomTextSizeMessage(1.0);
    setCustomTextSizeDetails(1.0);
    setCustomTextSizeReception(1.0);
    setCustomTextSizeColors(1.0);
    setCustomTextBoldness("normal");
    setCustomTextAlign("center");
    setUserHasCustomAlignment(false);
    setUserHasCustomTextColor(false);
    if (customBgInputRef && customBgInputRef.current) {
      customBgInputRef.current.value = "";
    }
    toast.success("Theme settings reset to defaults! Click 'Save Customizations' below to save changes.");
  };

  return (
    <div className="space-y-6">
      {/* Invitation Theme Options */}
      <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
        <button
          type="button"
          onClick={() => setShowThemeLayout(!showThemeLayout)}
          className="w-full flex justify-between items-center text-sm font-semibold uppercase tracking-widest text-[#D8B76A] hover:text-white transition py-1 cursor-pointer outline-none"
        >
          <span className="flex items-center gap-2">
            <span>🎨</span> 2. Invitation Theme Layout
            {isFree && (
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                Upgrade
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] text-[#D8B76A]">{showThemeLayout ? "▲ Hide" : "▼ Show"}</span>
        </button>

        {showThemeLayout && (
          <div className="space-y-6 pt-2 border-t border-white/5 animate-fade-in">

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Theme Layout</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-3 text-sm text-white focus:border-[#D8B76A]/60 outline-none"
            value={cardTheme}
            onChange={(e) => {
              const val = e.target.value;
              setCardTheme(val);
              if (val !== "custom") setCustomCardBg(""); // Clear template overlay when switching to a built-in theme
              setCustomTextColor(getSmartTextColor(val, val !== "custom" ? "" : customCardBg));
              setUserHasCustomTextColor(false);

              const isLocked = (isFree && val !== "floral") || (isPlus && val === "custom");
              if (isLocked) {
                const reqTier = (val === "custom" || val === "stardust" || val === "forest") ? "Pro" : "Plus / Pro";
                toast.info(`✨ Previewing premium theme layout! Upgrade to ${reqTier} to save this theme.`, { toastId: "theme-select-preview" });
              }
            }}
          >
            {THEMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>

          {/* Theme Previews Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {THEMES.map((theme) => {
              const isLocked =
                (isFree && theme.value !== "floral") ||
                (isPlus && theme.value === "custom");
              const isSelected = cardTheme === theme.value;

              let previewStyle = {};
              let textStyle = {};
              let borderClass = "border border-white/10";

              if (theme.value === "floral") {
                previewStyle = {
                  backgroundColor: "#F5EBE6",
                  backgroundImage: "radial-gradient(circle, #F5EBE6 60%, #E6DFDA 100%)",
                };
                textStyle = { color: "#1A2E4A" };
              } else if (theme.value === "minimalist") {
                previewStyle = { backgroundColor: "#FDFDFD" };
                textStyle = { color: "#2E3A59" };
                borderClass = "border-2 border-double border-[#2E3A59]/30";
              } else if (theme.value === "navy") {
                previewStyle = { background: "url('/templates/elegant_gold_frame_with_navy_backdrop.png') center/cover no-repeat" };
                textStyle = { color: "#D8B76A" };
                borderClass = "border border-[#D8B76A]";
              } else if (theme.value === "stardust") {
                previewStyle = { backgroundColor: "#06080F" };
                textStyle = { color: "#FFFFFF" };
                borderClass = "border border-white/20";
              } else if (theme.value === "forest") {
                previewStyle = { backgroundColor: "#0F2818" };
                textStyle = { color: "#F5D68F" };
                borderClass = "border border-white/20";
              } else if (theme.value === "custom") {
                previewStyle = customCardBg
                  ? { background: `url(${customCardBg}) center/cover no-repeat` }
                  : {
                      backgroundColor: "#1E293B",
                      backgroundImage: "radial-gradient(circle, #334155 0%, #0F172A 100%)",
                    };
                textStyle = { color: customTextColor || "#D8B76A" };
              }

              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => {
                    setCardTheme(theme.value);
                    if (theme.value !== "custom") setCustomCardBg(""); // Clear template overlay when switching to a built-in theme
                    setCustomTextColor(getSmartTextColor(theme.value, theme.value !== "custom" ? "" : customCardBg));
                    if (isLocked) {
                      const reqTier = (theme.value === "custom" || theme.value === "stardust" || theme.value === "forest") ? "Pro" : "Plus / Pro";
                      toast.info(`✨ Previewing premium theme layout! Upgrade to ${reqTier} to save this theme.`, { toastId: "theme-select-preview" });
                    }
                  }}
                  className={`relative h-20 rounded-xl overflow-hidden flex flex-col justify-between p-2.5 transition-all duration-300 ${borderClass} ${isSelected
                    ? "ring-2 ring-[#D8B76A] ring-offset-2 ring-offset-[#070A13] scale-98"
                    : "hover:scale-102 hover:opacity-90"
                    }`}
                  style={previewStyle}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                      Active
                    </span>
                  )}

                  {isLocked && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-1.5 z-10 hover:bg-black/60 transition duration-300">
                      <span className="text-sm">🔒</span>
                      <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                        {theme.value === "custom" ? "Pro Only" : "Plus / Pro"}
                      </span>
                      <span className="text-[6px] text-white/50 uppercase mt-0.5 tracking-wide">
                        Click to Preview
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-start text-left w-full h-full justify-between select-none">
                    <span className="text-[7px] uppercase font-bold tracking-widest opacity-60" style={textStyle}>
                      Theme style
                    </span>
                    <span className="text-[9px] font-bold leading-tight block truncate w-full" style={textStyle}>
                      {theme.value === "custom"
                        ? "Custom Design"
                        : theme.value.charAt(0).toUpperCase() + theme.value.slice(1)}
                    </span>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[6px] opacity-40 font-mono" style={textStyle}>
                        VowLink
                      </span>
                      {theme.value === "stardust" && <span className="text-[7px] text-yellow-300 animate-pulse">✨</span>}
                      {theme.value === "forest" && <span className="text-[7px] text-emerald-400 animate-pulse">🍃</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom fonts */}
        {!isFree && (
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50 font-semibold">Custom Typeface (Plus / Pro)</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-3 text-sm text-white focus:border-[#D8B76A]/60 outline-none"
              value={customFontFamily}
              onChange={(e) => setCustomFontFamily(e.target.value)}
            >
              {FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        )}

         {/* Custom text color override */}
        {!isFree && (
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50 font-semibold">Custom Text Color Override (Plus / Pro)</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-10 h-10 border border-white/20 rounded bg-transparent cursor-pointer"
                value={customTextColor}
                onChange={(e) => {
                  setCustomTextColor(e.target.value);
                  setUserHasCustomTextColor(true);
                }}
              />
              <input
                type="text"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs outline-none focus:border-[#D8B76A]/60 text-white font-mono"
                value={customTextColor}
                onChange={(e) => {
                  setCustomTextColor(e.target.value);
                  setUserHasCustomTextColor(true);
                }}
                placeholder="#1A2E4A"
              />
            </div>
          </div>
        )}

        {/* Guidelines and Pre-made Templates (All Tiers) */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-xs text-amber-200/90 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-300">
              <span>⚠️</span> Design Guidelines: Text-Free Images Only
            </p>
            All background card designs (both pre-made templates and custom uploads) must be **completely blank background designs containing no pre-printed text or names**. VowLink dynamically overlays the couple names, RSVP details, and dates in real-time. If your design has text on it, the live invitation text will overlap and clash.
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs uppercase tracking-widest text-[#D8B76A] font-bold">Select Pre-made Background Design</h4>
            </div>

            {/* Plain Background option */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setCustomCardBg("");
                  setCardTheme("plain");
                  setCustomTextColor(getSmartTextColor("plain", ""));
                  setUserHasCustomTextColor(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  cardTheme === "plain"
                    ? "bg-[#D8B76A] text-[#070A13] border-[#D8B76A]"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                }`}
              >
                Plain Solid Background (No Template)
              </button>
            </div>

            {/* Free Templates */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Free Tier Templates (Unlocked)</p>
              <div className="grid grid-cols-2 gap-3">
                {PREMADE_TEMPLATES.filter(t => t.tier === "free").map(t => {
                  const isSelected = cardTheme === "custom" && customCardBg === t.url;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setCustomCardBg(t.url);
                        setCardTheme("custom");
                        setCustomTextColor(getSmartTextColor("custom", t.url));
                        const layout = getTemplateLayout("custom", t.url);
                        if (layout && layout.align) {
                          setCustomTextAlign(layout.align);
                        }
                        // Note: userHasCustomAlignment is NOT reset here.
                        // Template selection only updates the default alignment (customTextAlign),
                        // but if the user had manually overridden alignment, that override persists.
                        setUserHasCustomTextColor(false);
                      }}
                      className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />
                      <div className="text-left z-10 w-full">
                        <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                        <span className="text-[7px] text-[#D8B76A] uppercase font-bold tracking-widest">Free</span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plus Templates */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Plus Tier Templates</p>
              <div className="grid grid-cols-2 gap-3">
                {PREMADE_TEMPLATES.filter(t => t.tier === "plus").map(t => {
                  const isLocked = isFree;
                  const isSelected = cardTheme === "custom" && customCardBg === t.url;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setCustomCardBg(t.url);
                        setCardTheme("custom");
                        setCustomTextColor(getSmartTextColor("custom", t.url));
                        checkSmartAlignment(t.url);
                        const layout = getTemplateLayout("custom", t.url);
                        if (layout && layout.align) {
                          setCustomTextAlign(layout.align);
                        }
                        setUserHasCustomTextColor(false);
                        if (isLocked) {
                          toast.info("✨ Previewing Plus template! Upgrade to Plus or Pro to save this template. 🔒", { toastId: "plus-template-preview" });
                        }
                      }}
                      className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />

                      {isLocked && (
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20 hover:bg-black/60 transition duration-300">
                          <span className="text-sm">🔒</span>
                          <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                            Plus / Pro
                          </span>
                          <span className="text-[6px] text-white/50 uppercase mt-0.5 tracking-wide">
                            Click to Preview
                          </span>
                        </div>
                      )}

                      <div className="text-left z-10 w-full">
                        <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                        <span className="text-[7px] text-amber-400 uppercase font-bold tracking-widest">Plus</span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pro Templates */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Pro Tier Templates</p>
              <div className="grid grid-cols-2 gap-3">
                {PREMADE_TEMPLATES.filter(t => t.tier === "pro").map(t => {
                  const isLocked = isFree || isPlus;
                  const isSelected = cardTheme === "custom" && customCardBg === t.url;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setCustomCardBg(t.url);
                        setCardTheme("custom");
                        setCustomTextColor(getSmartTextColor("custom", t.url));
                        checkSmartAlignment(t.url);
                        const layout = getTemplateLayout("custom", t.url);
                        if (layout && layout.align) {
                          setCustomTextAlign(layout.align);
                        }
                        setUserHasCustomTextColor(false);
                        if (isLocked) {
                          toast.info("✨ Previewing Pro template! Upgrade to Pro to save this template. 🔒", { toastId: "pro-template-preview" });
                        }
                      }}
                      className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />

                      {isLocked && (
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20 hover:bg-black/60 transition duration-300">
                          <span className="text-sm">🔒</span>
                          <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                            Pro Only
                          </span>
                          <span className="text-[6px] text-white/50 uppercase mt-0.5 tracking-wide">
                            Click to Preview
                          </span>
                        </div>
                      )}

                      <div className="text-left z-10 w-full">
                        <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                        <span className="text-[7px] text-amber-500 uppercase font-bold tracking-widest">Pro</span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Custom card upload configurations */}
        {isPro && (
          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">Custom Card Background Design</p>
              {cardTheme !== "custom" && (
                <button
                  type="button"
                  onClick={() => {
                    setCardTheme("custom");
                    setCustomTextColor(getSmartTextColor("custom", customCardBg));
                  }}
                  className="text-[9px] uppercase tracking-wider text-[#D8B76A] hover:underline"
                >
                  Select Custom Theme
                </button>
              )}
            </div>

            <div>
              <p className="text-[10px] text-amber-300 font-semibold mb-2 flex items-center gap-1">
                <span>⚠️</span> Upload blank background design only (no names/dates/text).
              </p>
              <label className="block text-[9px] text-white/50 uppercase mb-1">Upload Card Background Design (.png / .jpg)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleCustomCardBgUpload(e);
                  setCardTheme("custom");
                  setCustomTextColor("#FFFFFF");
                }}
                className="w-full text-xs text-white/50 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D8B76A]/10 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/20"
              />
              {customCardBg && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-20 w-16 rounded border border-white/10 overflow-hidden relative group">
                    <img src={customCardBg} alt="Upload Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        toast.dismiss();
                        const ToastConfirm = ({ closeToast }) => (
                          <div className="flex flex-col gap-2 p-1 text-white">
                            <p className="font-semibold text-xs leading-relaxed">
                              Are you sure you want to remove your custom card design background?
                            </p>
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                type="button"
                                onClick={closeToast}
                                className="px-2 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomCardBg("");
                                  closeToast();
                                  toast.success("Custom background removed.");
                                }}
                                className="px-2 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        );
                        toast.warn(<ToastConfirm />, {
                          position: "top-center",
                          autoClose: false,
                          closeOnClick: false,
                          draggable: false,
                          closeButton: false,
                        });
                      }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                  <span className="text-[10px] text-white/55">
                    Custom design uploaded. {cardTheme !== "custom" ? "Select Custom theme to apply." : "Applied successfully!"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

        {/* Fine-Tuning Controls — Always visible for all tiers, any theme */}
        <div className="space-y-4 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => setShowFineTuning(!showFineTuning)}
            className="w-full flex justify-between items-center text-sm font-semibold uppercase tracking-widest text-[#D8B76A] hover:text-white transition py-1 cursor-pointer outline-none"
          >
            <span className="flex items-center gap-2">
              <span>🔧</span> Fine-Tuning Controls
            </span>
            <span className="font-mono text-[10px] text-[#D8B76A]">{showFineTuning ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showFineTuning && (
            <div className="space-y-4 mt-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">Fine-Tuning</p>
          </div>

          {/* Vertical position offset */}
          <div>
            <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1.5">
              <span>Vertical position offset</span>
              <span className="font-mono text-[#D8B76A]">{customVerticalOffset}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={customVerticalOffset <= -150}
                onClick={() => setCustomVerticalOffset(Math.max(-150, customVerticalOffset - 5))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 text-center font-mono text-xs text-white/80 select-none">
                {customVerticalOffset}px
              </div>
              <button
                type="button"
                disabled={customVerticalOffset >= 150}
                onClick={() => setCustomVerticalOffset(Math.min(150, customVerticalOffset + 5))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Horizontal position offset */}
          <div>
            <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1.5">
              <span>Horizontal position offset</span>
              <span className="font-mono text-[#D8B76A]">{customHorizontalOffset}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={customHorizontalOffset <= -100}
                onClick={() => setCustomHorizontalOffset(Math.max(-100, customHorizontalOffset - 5))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 text-center font-mono text-xs text-white/80 select-none">
                {customHorizontalOffset}px
              </div>
              <button
                type="button"
                disabled={customHorizontalOffset >= 100}
                onClick={() => setCustomHorizontalOffset(Math.min(100, customHorizontalOffset + 5))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Text Size scale multiplier */}
          <div>
            <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1.5">
              <span>Text Size scale multiplier</span>
              <span className="font-mono text-[#D8B76A]">{customTextSize.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={customTextSize <= 0.6}
                onClick={() => setCustomTextSize(Number(Math.max(0.6, customTextSize - 0.05).toFixed(2)))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 text-center font-mono text-xs text-white/80 select-none">
                {customTextSize.toFixed(2)}x
              </div>
              <button
                type="button"
                disabled={customTextSize >= 1.6}
                onClick={() => setCustomTextSize(Number(Math.min(1.6, customTextSize + 0.05).toFixed(2)))}
                className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Detailed section multipliers */}
          <div className="border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => setShowDetailedScaling(!showDetailedScaling)}
              className="w-full flex justify-between items-center text-[10px] uppercase font-bold text-white/70 hover:text-white transition py-1 cursor-pointer outline-none"
            >
              <span className="flex items-center gap-1.5">
                <span>⚙️</span> Detailed Section Font Sizes
              </span>
              <span className="font-mono text-[#D8B76A]">{showDetailedScaling ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showDetailedScaling && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-l-2 border-[#D8B76A]/20 pl-3 transition-all duration-300">
                {[
                  { label: "Couple Names", value: customTextSizeCoupleNames, setter: setCustomTextSizeCoupleNames },
                  { label: "Personal Message", value: customTextSizeMessage, setter: setCustomTextSizeMessage },
                  { label: "Joining Statement", value: customTextSizeSubtitle, setter: setCustomTextSizeSubtitle },
                  { label: "Invitation Title", value: customTextSizeTitle, setter: setCustomTextSizeTitle },
                  { label: "Guest Greeting", value: customTextSizeGreeting, setter: setCustomTextSizeGreeting },
                  { label: "Date & Venue Address", value: customTextSizeDetails, setter: setCustomTextSizeDetails },
                  { label: "Reception Details", value: customTextSizeReception, setter: setCustomTextSizeReception },
                  { label: "Color Palette Chips", value: customTextSizeColors, setter: setCustomTextSizeColors },
                ].map(slider => (
                  <div key={slider.label}>
                    <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1.5">
                      <span>{slider.label}</span>
                      <span className="font-mono text-[#D8B76A]">{slider.value.toFixed(2)}x</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={slider.value <= 0.5}
                        onClick={() => slider.setter(Number(Math.max(0.5, slider.value - 0.05).toFixed(2)))}
                        className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center font-mono text-xs text-white/80 select-none">
                        {slider.value.toFixed(2)}x
                      </div>
                      <button
                        type="button"
                        disabled={slider.value >= 2.5}
                        onClick={() => slider.setter(Number(Math.min(2.5, slider.value + 0.05).toFixed(2)))}
                        className="h-8 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[9px] text-white/50 uppercase mb-2">Text Boldness (Weight)</label>
            <div className="flex gap-2">
              {[
                { value: "normal", label: "Normal" },
                { value: "medium", label: "Medium" },
                { value: "bold", label: "Bold" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setCustomTextBoldness(item.value);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                    customTextBoldness === item.value
                      ? "bg-[#D8B76A] text-[#070A13]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-white/50 uppercase mb-2">Text Alignment</label>
            <div className="flex gap-2">
              {["left", "center", "right"].map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => {
                    setCustomTextAlign(align);
                    setUserHasCustomAlignment(true);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                    customTextAlign === align
                      ? "bg-[#D8B76A] text-[#070A13]"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
          </div>
          )}
        </div>

        {/* General Theme Reset defaults (Visible to all tiers) */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={handleResetTheme}
            className="text-[10px] uppercase font-bold tracking-wider text-red-400/80 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-1.5 rounded-lg border border-red-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            ↺ Reset Theme Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
