import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ColorPicker from "../ColorPicker";
import { useSettings } from "../../context/SettingsContext";
import { getTemplateLayout } from "../../utils/templateLayouts";
import { Icon } from "@iconify/react";

export const THEMES = [
  { value: "floral", label: "Classic Floral (Classic / All plans)" },
  { value: "minimalist", label: "Modern Minimalist (Classic / All plans)" },
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
    url: "/templates/template_free_1.webp",
    preview: "/templates/template_free_1.webp",
  },
  {
    tier: "free",
    name: "Classic Floral",
    url: "/templates/Blush Pink Watercolor.webp",
    preview: "/templates/Blush Pink Watercolor.webp",
  },
  {
    tier: "free",
    name: "Modern Minimalist",
    url: "/templates/Cream Floral Elegance.webp",
    preview: "/templates/Cream Floral Elegance.webp",
  },
  {
    tier: "free",
    name: "Classic Gallery Orchid Breeze",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_09 AM (1).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_09 AM (1).webp",
  },
  {
    tier: "free",
    name: "Classic Gallery Laurel",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_10 AM (2).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_10 AM (2).webp",
  },
  {
    tier: "free",
    name: "Classic Gallery Spring Whimsy",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_14 AM (3).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_14 AM (3).webp",
  },
  {
    tier: "free",
    name: "Classic Gallery Eucalyptus Arch",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_16 AM (4).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_16 AM (4).webp",
  },
  {
    tier: "plus",
    name: "Emerald Eucalyptus Frame",
    url: "/templates/Emerald Eucalyptus Frame.webp",
    preview: "/templates/Emerald Eucalyptus Frame.webp",
  },
  {
    tier: "plus",
    name: "Royal Navy Gold Frame",
    url: "/templates/elegant_gold_frame_with_navy_backdrop.webp",
    preview: "/templates/elegant_gold_frame_with_navy_backdrop.webp",
  },
  {
    tier: "plus",
    name: "Royal Navy Lace Accent",
    url: "/templates/Royal Navy Lace Accent.webp",
    preview: "/templates/Royal Navy Lace Accent.webp",
  },
  {
    tier: "plus",
    name: "Elegant Purple & Silver Floral",
    url: "/templates/Elegant purple and silver floral.webp",
    preview: "/templates/Elegant purple and silver floral.webp",
  },
  {
    tier: "pro",
    name: "Midnight Black Floral",
    url: "/templates/template_plus_3.webp",
    preview: "/templates/template_plus_3.webp",
  },
  {
    tier: "pro",
    name: "Deep Black Rose",
    url: "/templates/Midnight Black Floral2.webp",
    preview: "/templates/Midnight Black Floral2.webp",
  },
  {
    tier: "pro",
    name: "Dark Black Gold Marble",
    url: "/templates/Dark Black Gold Marble.webp",
    preview: "/templates/Dark Black Gold Marble.webp",
  },
  {
    tier: "pro",
    name: "Burgundy Velvet Filigree",
    url: "/templates/Burgundy Velvet Filigree.webp",
    preview: "/templates/Burgundy Velvet Filigree.webp",
  },
  {
    tier: "pro",
    name: "Royal Emerald Gold Frame",
    url: "/templates/Royal Emerald Gold Frame.webp",
    preview: "/templates/Royal Emerald Gold Frame.webp",
  },
  {
    tier: "pro",
    name: "Blush Pink & Rose Gold Glitter",
    url: "/templates/Blush Pink & Rose Gold Glitter.webp",
    preview: "/templates/Blush Pink & Rose Gold Glitter.webp",
  },
  {
    tier: "pro",
    name: "Minimalist Linen Ivory Leaves",
    url: "/templates/template_pro_5.webp",
    preview: "/templates/template_pro_5.webp",
  },
  {
    tier: "pro",
    name: "Starry Lavender Gold Dust",
    url: "/templates/template_pro_6.webp",
    preview: "/templates/template_pro_6.webp",
  },
  {
    tier: "pro",
    name: "Classic Charcoal Gold Floral",
    url: "/templates/template_pro_7.webp",
    preview: "/templates/template_pro_7.webp",
  },
];

const getTemplatePreviewStyles = (url) => {
  return { background: `url('${url}') center/cover no-repeat` };
};

const renderTemplatePreviewOrnaments = () => {
  return null;
};

const ThemeSelector = () => {
  const {
    cardTheme,
    setCardTheme,
    defaultGuestTheme,
    setDefaultGuestTheme,
    customCardBg,
    setCustomCardBg,
    customTextColor,
    setCustomTextColor,
    customTextColors,
    setCustomTextColors,
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
    setUserHasCustomTextColor,
    isFree,
    isPlus,
    isPro,
    customBgInputRef,
    handleCustomCardBgUpload,
    getSmartTextColor,
    checkSmartAlignment,
  } = useSettings();
  const isUnpaid = (JSON.parse(localStorage.getItem("user") || "{}").tier || "unpaid") === "unpaid";

  const [showDetailedScaling, setShowDetailedScaling] = useState(false);
  const [showDetailedColors, setShowDetailedColors] = useState(false);
  const [showThemeLayout, setShowThemeLayout] = useState(true);
  const [showFineTuning, setShowFineTuning] = useState(true);

  const handleResetTheme = () => {
    setCardTheme("floral");
    setCustomCardBg("");
    setCustomTextColor("#1A2E4A");
    setCustomTextColors({});
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

  const detailedSections = [
    { key: "coupleNames", label: "Couple Names" },
    { key: "message", label: "Personal Message" },
    { key: "subtitle", label: "Joining Statement" },
    { key: "title", label: "Invitation Title" },
    { key: "greeting", label: "Guest Greeting" },
    { key: "details", label: "Date & Venue Address" },
    { key: "reception", label: "Reception Details" },
    { key: "colors", label: "Color Palette Chips" },
  ];

  const updateSectionTextColor = (key, value) => {
    setCustomTextColors((prev) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Invitation Theme Options */}
      <div className="settings-theme-panel relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1220] p-3 sm:p-5 space-y-6">
        <button
          type="button"
          onClick={() => setShowThemeLayout(!showThemeLayout)}
          className="flex w-full min-w-0 items-start justify-between gap-3 py-1 text-sm font-semibold uppercase tracking-widest text-[#D8B76A] transition hover:text-white cursor-pointer outline-none"
        >
          <span className="flex min-w-0 items-start gap-2 text-left leading-snug">
            <Icon icon="lucide:palette" className="w-4 h-4 text-[#D8B76A] shrink-0" /> 2. Invitation Theme Layout
            {isFree && (
              <span className="shrink-0 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                Upgrade
              </span>
            )}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[#D8B76A]">
            <Icon icon={showThemeLayout ? "lucide:chevron-up" : "lucide:chevron-down"} className="h-3 w-3" />
            {showThemeLayout ? "Hide" : "Show"}
          </span>
        </button>

        {showThemeLayout && (
          <div className="space-y-6 pt-2 border-t border-white/5 animate-fade-in">
            <div className="settings-theme-subpanel relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#D8B76A] font-bold">Default Guest Invite Theme</p>
                <p className="mt-1 text-[10px] text-white/45 leading-relaxed">
                  Controls the first theme guests see. Their theme toggle still saves their own choice on their device.
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3">
                {[
                  { value: "dark", label: "Dark Theme", icon: "lucide:moon" },
                  { value: "light", label: "Light Theme", icon: "lucide:sun" },
                  { value: "system", label: "Match Device/System", icon: "lucide:monitor" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDefaultGuestTheme(option.value)}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${
                      defaultGuestTheme === option.value
                        ? "border-[#D8B76A] bg-[#D8B76A]/12 text-[#D8B76A]"
                        : "border-white/10 bg-[#070A13]/60 text-white/60 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <Icon icon={option.icon} className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 text-[10px] font-bold uppercase tracking-wider leading-tight">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

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

                  const isLocked = (isFree && !["floral", "minimalist"].includes(val)) || (isPlus && val === "custom");
                  if (isLocked) {
                    const reqTier = (val === "custom" || val === "stardust" || val === "forest") ? "Pro" : "Plus / Pro";
                    toast.info(`Previewing premium theme layout! Upgrade to ${reqTier} to save this theme.`, { toastId: "theme-select-preview" });
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
              <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
                {THEMES.map((theme) => {
                  const isLocked =
                    (isFree && !["floral", "minimalist"].includes(theme.value)) ||
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
                    previewStyle = { background: "url('/templates/elegant_gold_frame_with_navy_backdrop.webp') center/cover no-repeat" };
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
                          toast.info(`Previewing premium theme layout! Upgrade to ${reqTier} to save this theme.`, { toastId: "theme-select-preview" });
                        }
                      }}
                      className={`relative isolate h-20 rounded-xl overflow-hidden flex flex-col justify-between p-2.5 transition-all duration-300 ${borderClass} ${isSelected
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
                          <Icon icon="lucide:lock" className="h-4 w-4 text-[#D8B76A]" />
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
                          {theme.value === "stardust" && <Icon icon="lucide:sparkles" className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />}
                          {theme.value === "forest" && <Icon icon="lucide:leaf" className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />}
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
              <div className="theme-guideline-alert rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200/90">
                <p className="mb-1 flex items-start gap-1.5 font-semibold text-amber-300">
                  <Icon icon="lucide:alert-triangle" className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Design Guidelines: Text-Free Images Only
                </p>
                All background card designs (both pre-made templates and custom uploads) must be **completely blank background designs containing no pre-printed text or names**. VowLink dynamically overlays the couple names, RSVP details, and dates in real-time. If your design has text on it, the live invitation text will overlap and clash.
              </div>

              <div className="space-y-4">
                <div className="flex min-w-0 items-start justify-between">
                  <h4 className="min-w-0 text-xs font-bold uppercase tracking-widest text-[#D8B76A] leading-snug">Select Pre-made Background Design</h4>
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
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition sm:px-4 ${cardTheme === "plain"
                      ? "bg-[#D8B76A] text-[#070A13] border-[#D8B76A]"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    Plain Solid Background (No Template)
                  </button>
                </div>

                {/* Classic Templates */}
                <div className="space-y-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">
                    Classic Templates {isUnpaid ? "(Locked)" : "(Unlocked)"}
                  </p>
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    {PREMADE_TEMPLATES.filter(t => t.tier === "free" && !t.onlyInGallery).map(t => {
                      const isSelected = cardTheme === "custom" && customCardBg === t.url;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => {
                            if (isUnpaid) {
                              setCustomCardBg(t.url);
                              setCardTheme("custom");
                              setCustomTextColor(getSmartTextColor("custom", t.url));
                              const layout = getTemplateLayout("custom", t.url);
                              if (layout && layout.align) {
                                setCustomTextAlign(layout.align);
                              }
                              setUserHasCustomTextColor(false);
                              toast.info("Previewing Classic template. Activate Classic to save this template.", { toastId: "classic-template-preview" });
                              return;
                            }
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
                          className={`template-preview-card relative isolate h-24 rounded-xl overflow-hidden border transition group flex flex-col justify-end p-3 ${
                            isUnpaid ? "hover:scale-102" : "hover:scale-102"
                          } ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                            }`}
                          style={getTemplatePreviewStyles(t.url)}
                        >
                          {renderTemplatePreviewOrnaments(t.url)}
                          <div className={`template-preview-shade absolute inset-0 transition ${isUnpaid ? "bg-black/65 backdrop-blur-[1px]" : "bg-black/45 group-hover:bg-black/30"}`} />
                          <div className="template-preview-label text-left z-10 w-full">
                            <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                            <span className="inline-flex items-center gap-1 text-[7px] text-[#D8B76A] uppercase font-bold tracking-widest">
                              {isUnpaid && <Icon icon="lucide:lock" className="h-2.5 w-2.5" />}
                              Classic
                            </span>
                          </div>
                          {isUnpaid && !isSelected && (
                            <span className="absolute top-2 right-2 rounded bg-[#070A13]/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#D8B76A] shadow-md">
                              Locked
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                              {isUnpaid ? "Preview" : "Active"}
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
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    {PREMADE_TEMPLATES.filter(t => t.tier === "plus" && !t.onlyInGallery).map(t => {
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
                              toast.info("Previewing Plus template! Upgrade to Plus or Pro to save this template.", { toastId: "plus-template-preview" });
                            }
                          }}
                          className={`template-preview-card relative isolate h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                            }`}
                          style={getTemplatePreviewStyles(t.url)}
                        >
                          {renderTemplatePreviewOrnaments(t.url)}
                          <div className={`template-preview-shade absolute inset-0 transition ${isLocked ? "bg-black/65 backdrop-blur-[1px]" : "bg-black/45 group-hover:bg-black/30"}`} />

                          <div className="template-preview-label text-left z-10 w-full">
                            <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                            <span className="inline-flex items-center gap-1 text-[7px] text-amber-400 uppercase font-bold tracking-widest">
                              {isLocked && <Icon icon="lucide:lock" className="h-2.5 w-2.5" />}
                              Plus
                            </span>
                          </div>
                          {isLocked && !isSelected && (
                            <span className="absolute top-2 right-2 rounded bg-[#070A13]/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#D8B76A] shadow-md">
                              Locked
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                              {isLocked ? "Preview" : "Active"}
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
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    {PREMADE_TEMPLATES.filter(t => t.tier === "pro" && !t.onlyInGallery).map(t => {
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
                              toast.info("Previewing Pro template! Upgrade to Pro to save this template.", { toastId: "pro-template-preview" });
                            }
                          }}
                          className={`template-preview-card relative isolate h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                            }`}
                          style={getTemplatePreviewStyles(t.url)}
                        >
                          {renderTemplatePreviewOrnaments(t.url)}
                          <div className={`template-preview-shade absolute inset-0 transition ${isLocked ? "bg-black/65 backdrop-blur-[1px]" : "bg-black/45 group-hover:bg-black/30"}`} />

                          <div className="template-preview-label text-left z-10 w-full">
                            <p className="text-[10px] font-bold text-white leading-tight mb-0.5">{t.name}</p>
                            <span className="inline-flex items-center gap-1 text-[7px] text-amber-500 uppercase font-bold tracking-widest">
                              {isLocked && <Icon icon="lucide:lock" className="h-2.5 w-2.5" />}
                              Pro
                            </span>
                          </div>
                          {isLocked && !isSelected && (
                            <span className="absolute top-2 right-2 rounded bg-[#070A13]/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#D8B76A] shadow-md">
                              Locked
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md">
                              {isLocked ? "Preview" : "Active"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* See More Button */}
                <Link
                  to="/admin/templates"
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#D8B76A] hover:text-[#070A13] hover:border-[#D8B76A] text-xs font-bold uppercase tracking-widest text-[#D8B76A] transition-all duration-300 cursor-pointer shadow-md"
                >
                  See More Templates <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
                </Link>
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
                    <Icon icon="lucide:alert-triangle" className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Upload blank background design only (no names/dates/text).
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
                      <div className="h-20 w-16 rounded border border-white/10 overflow-hidden relative isolate group shrink-0">
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
              <Icon icon="lucide:sliders" className="w-4 h-4 text-[#D8B76A]" /> Fine-Tuning Controls
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#D8B76A]">
              <Icon icon={showFineTuning ? "lucide:chevron-up" : "lucide:chevron-down"} className="h-3 w-3" />
              {showFineTuning ? "Hide" : "Show"}
            </span>
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
                    <Icon icon="lucide:settings" className="w-3.5 h-3.5 text-[#D8B76A]" /> Detailed Section Font Sizes
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[#D8B76A]">
                    <Icon icon={showDetailedScaling ? "lucide:chevron-up" : "lucide:chevron-down"} className="h-3 w-3" />
                    {showDetailedScaling ? "Hide" : "Show"}
                  </span>
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

              {/* Detailed section text colors */}
              <div className="border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDetailedColors(!showDetailedColors)}
                  className="w-full flex justify-between items-center text-[10px] uppercase font-bold text-white/70 hover:text-white transition py-1 cursor-pointer outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon icon="lucide:paintbrush" className="w-3.5 h-3.5 text-[#D8B76A]" /> Detailed Section Text Colors
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[#D8B76A]">
                    <Icon icon={showDetailedColors ? "lucide:chevron-up" : "lucide:chevron-down"} className="h-3 w-3" />
                    {showDetailedColors ? "Hide" : "Show"}
                  </span>
                </button>
                {showDetailedColors && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-l-2 border-[#D8B76A]/20 pl-3 transition-all duration-300">
                    {detailedSections.map((section) => {
                      const value = customTextColors?.[section.key] || "";
                      return (
                        <div key={section.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[9px] text-white/50 uppercase tracking-wider">{section.label}</span>
                            <button
                              type="button"
                              onClick={() => updateSectionTextColor(section.key, "")}
                              disabled={!value}
                              className="text-[8px] uppercase font-bold text-white/35 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                              Reset
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={value || customTextColor || "#1A2E4A"}
                              onChange={(e) => updateSectionTextColor(section.key, e.target.value)}
                              className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                              aria-label={`${section.label} text color`}
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateSectionTextColor(section.key, e.target.value)}
                              placeholder="Template default"
                              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#070A13]/60 px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#D8B76A]/60"
                            />
                          </div>
                        </div>
                      );
                    })}
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
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${customTextBoldness === item.value
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
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${customTextAlign === align
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
            <Icon icon="lucide:rotate-ccw" className="h-3.5 w-3.5" />
            Reset Theme Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
