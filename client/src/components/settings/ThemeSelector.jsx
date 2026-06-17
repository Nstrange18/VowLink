import React from "react";
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
    url: "/templates/template_free_2.png",
    preview: "/templates/template_free_2.png",
  },
  {
    tier: "free",
    name: "Cream Floral Elegance",
    url: "/templates/template_free_3.png",
    preview: "/templates/template_free_3.png",
  },
  {
    tier: "plus",
    name: "Emerald Eucalyptus Frame",
    url: "/templates/template_plus_1.png",
    preview: "/templates/template_plus_1.png",
  },
  {
    tier: "plus",
    name: "Royal Navy Lace Accent",
    url: "/templates/template_plus_2.png",
    preview: "/templates/template_plus_2.png",
  },
  {
    tier: "pro",
    name: "Midnight Black Floral",
    url: "/templates/template_plus_3.png",
    preview: "/templates/template_plus_3.png",
  },
  {
    tier: "pro",
    name: "Dark Black Gold Marble",
    url: "/templates/template_pro_1.png",
    preview: "/templates/template_pro_1.png",
  },
  {
    tier: "pro",
    name: "Burgundy Velvet Filigree",
    url: "/templates/template_pro_2.png",
    preview: "/templates/template_pro_2.png",
  },
  {
    tier: "pro",
    name: "Royal Emerald Gold Frame",
    url: "/templates/template_pro_3.png",
    preview: "/templates/template_pro_3.png",
  },
  {
    tier: "pro",
    name: "Blush Pink & Rose Gold Glitter",
    url: "/templates/template_pro_4.png",
    preview: "/templates/template_pro_4.png",
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
  if (url === "/templates/template_free_2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="85" cy="115" r="30" fill="#FFE5E9" opacity="0.4" />
        <circle cx="95" cy="50" r="25" fill="#FFF0F2" opacity="0.5" />
        <path d="M100,20 Q80,40 85,60 Q90,80 100,90" stroke="#C3A38A" strokeWidth="1" opacity="0.6" />
        <path d="M100,50 Q75,70 80,95 Q85,120 100,130" stroke="#C3A38A" strokeWidth="1.2" opacity="0.5" />
        <circle cx="82" cy="55" r="5" fill="#F4B2B9" opacity="0.9" />
        <circle cx="78" cy="85" r="6" fill="#F4B2B9" opacity="0.95" />
        <circle cx="81" cy="110" r="5.5" fill="#F4B2B9" opacity="0.9" />
        <path d="M78,51 C73,48 70,52 78,55" fill="#B2C8B2" opacity="0.8" />
        <path d="M72,83 C67,80 64,84 72,87" fill="#B2C8B2" opacity="0.8" />
      </svg>
    );
  }
  if (url === "/templates/template_free_3.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="15" cy="35" r="35" fill="#F4ECE1" opacity="0.4" />
        <circle cx="10" cy="100" r="30" fill="#EFE5D8" opacity="0.35" />
        <path d="M0,15 Q25,35 20,60 Q15,85 0,110" stroke="#A89276" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M0,50 Q18,75 15,100 Q12,125 0,140" stroke="#A89276" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <path d="M12,28 C18,24 22,28 12,32" fill="#D2C2AD" opacity="0.8" />
        <path d="M18,48 C24,44 26,49 18,52" fill="#D2C2AD" opacity="0.9" />
        <path d="M15,85 C22,81 24,86 15,89" fill="#D2C2AD" opacity="0.8" />
        <path d="M10,120 C16,116 18,121 10,124" fill="#D2C2AD" opacity="0.8" />
        <circle cx="13" cy="38" r="2.5" fill="#D8B76A" />
        <circle cx="19" cy="68" r="3" fill="#D8B76A" />
        <circle cx="14" cy="102" r="2.5" fill="#D8B76A" />
      </svg>
    );
  }
  if (url === "/templates/template_free_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="15" cy="35" r="0.7" fill="#D8B76A" opacity="0.5" />
        <circle cx="25" cy="115" r="0.5" fill="#D8B76A" opacity="0.4" />
        <circle cx="80" cy="45" r="0.6" fill="#D8B76A" opacity="0.5" />
        <circle cx="75" cy="105" r="0.8" fill="#D8B76A" opacity="0.5" />
        <circle cx="45" cy="20" r="0.5" fill="#D8B76A" opacity="0.3" />
        <circle cx="55" cy="130" r="0.6" fill="#D8B76A" opacity="0.4" />
        <circle cx="90" cy="85" r="0.5" fill="#D8B76A" opacity="0.4" />
        <circle cx="12" cy="80" r="0.7" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }
  if (url === "/templates/template_plus_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="140" rx="6" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <path d="M6,6 Q20,8 15,22 Q12,30 6,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
        <path d="M14,15 C10,13 10,20 14,21 Z" fill="#7D9B76" opacity="0.7" />
        <circle cx="18" cy="8" r="2" fill="#A3B899" />
        <path d="M94,6 Q80,8 85,22 Q88,30 94,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="88" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
        <path d="M86,15 C90,13 90,20 86,21 Z" fill="#7D9B76" opacity="0.7" />
        <path d="M6,144 Q20,142 15,128 Q12,120 6,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
        <path d="M94,144 Q80,142 85,128 Q88,120 94,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="88" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
      </svg>
    );
  }
  if (url === "/templates/template_plus_2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <line x1="10" y1="0" x2="10" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.6" />
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.2" />
        <path d="M10,10 Q6,15 10,20 M10,30 Q6,35 10,40 M10,50 Q6,55 10,60 M10,70 Q6,75 10,80 M10,90 Q6,95 10,100 M10,110 Q6,115 10,120 M10,130 Q6,135 10,140" stroke="#D8B76A" strokeWidth="0.5" opacity="0.6" />
        <path d="M0,0 Q18,0 18,18 Q0,18 0,0 Z" fill="#D8B76A" opacity="0.12" />
        <path d="M0,150 Q18,150 18,132 Q0,132 0,150 Z" fill="#D8B76A" opacity="0.12" />
      </svg>
    );
  }
  if (url === "/templates/template_plus_3.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="20" cy="40" r="0.8" fill="#D8B76A" opacity="0.6" />
        <circle cx="30" cy="110" r="0.6" fill="#D8B76A" opacity="0.5" />
        <circle cx="75" cy="50" r="0.7" fill="#D8B76A" opacity="0.6" />
        <circle cx="80" cy="100" r="0.9" fill="#D8B76A" opacity="0.7" />
        <circle cx="40" cy="30" r="0.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="60" cy="120" r="0.7" fill="#D8B76A" opacity="0.6" />
        <circle cx="85" cy="80" r="0.6" fill="#D8B76A" opacity="0.5" />
        <circle cx="15" cy="70" r="0.8" fill="#D8B76A" opacity="0.6" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <path d="M100,5 Q70,40 85,75 Q100,110 80,145" stroke="#D8B76A" strokeWidth="0.8" fill="none" opacity="0.7" />
        <path d="M100,35 Q85,55 92,80 Q99,105 100,120" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M100,70 Q90,95 93,115 Q96,135 100,140" stroke="#D8B76A" strokeWidth="0.5" fill="none" opacity="0.4" />
        <circle cx="88" cy="20" r="1" fill="#D8B76A" opacity="0.4" />
        <circle cx="94" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="82" cy="95" r="0.75" fill="#D8B76A" opacity="0.3" />
        <circle cx="91" cy="130" r="1.2" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <path d="M0,15 A15,15 0 0,0 15,0 L0,0 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,15 A15,15 0 0,0 15,0" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,12 A12,12 0 0,0 12,0" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        <path d="M0,135 A15,15 0 0,1 15,150 L0,150 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,135 A15,15 0 0,1 15,150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,138 A12,12 0 0,1 12,150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <circle cx="12" cy="75" r="8" stroke="#D8B76A" strokeWidth="0.5" strokeDasharray="2,2" />
        <path d="M12,65 L12,85 M2,75 L22,75" stroke="#D8B76A" strokeWidth="0.5" />
        <circle cx="12" cy="75" r="2.5" fill="#D8B76A" />
        <circle cx="16" cy="45" r="1.5" fill="#D8B76A" opacity="0.9" />
        <circle cx="16" cy="105" r="1.5" fill="#D8B76A" opacity="0.9" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_3.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <rect x="6" y="6" width="88" height="138" rx="8" fill="none" stroke="#D8B76A" strokeWidth="1.5" opacity="0.6" />
        <rect x="7.5" y="7.5" width="85" height="135" rx="6.5" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <path d="M6,20 Q16,16 20,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,20 Q84,16 80,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M6,130 Q16,134 20,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,130 Q84,134 80,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M20,16 L21,19 L24,20 L21,21 L20,24 L19,21 L16,20 L19,19 Z" fill="#D8B76A" />
        <path d="M80,16 L81,19 L84,20 L81,21 L80,24 L79,21 L76,20 L79,19 Z" fill="#D8B76A" />
        <path d="M20,126 L21,129 L24,130 L21,131 L20,134 L19,131 L16,130 L19,129 Z" fill="#D8B76A" />
        <path d="M80,126 L81,129 L84,130 L81,131 L80,134 L79,131 L76,130 L79,129 Z" fill="#D8B76A" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_4.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="95" cy="15" r="4" fill="#E8B5AC" opacity="0.8" />
        <circle cx="88" cy="30" r="2.5" fill="#E8B5AC" opacity="0.6" />
        <circle cx="92" cy="48" r="3.5" fill="#E8B5AC" opacity="0.7" />
        <circle cx="84" cy="65" r="2" fill="#E8B5AC" opacity="0.5" />
        <circle cx="96" cy="85" r="4.5" fill="#E8B5AC" opacity="0.8" />
        <circle cx="89" cy="110" r="3" fill="#E8B5AC" opacity="0.6" />
        <circle cx="94" cy="135" r="4" fill="#E8B5AC" opacity="0.8" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_5.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <path d="M0,25 Q18,40 10,75 Q2,110 0,135" stroke="#7A8E7E" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        <path d="M9,32 C15,31 16,36 9,38 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M12,48 C18,49 16,54 12,53 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M11,68 C17,71 14,75 11,72 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M6,90 C12,94 9,98 6,95 Z" fill="#99AB9D" opacity="0.5" />
        <path d="M4,112 C10,115 8,119 4,116 Z" fill="#99AB9D" opacity="0.5" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_6.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <line x1="6" y1="0" x2="6" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.75" />
        <line x1="8" y1="0" x2="8" y2="150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        <path d="M6,5 Q2,10 6,15 M6,20 Q2,25 6,30 M6,35 Q2,40 6,45 M6,50 Q2,55 6,60 M6,65 Q2,70 6,75 M6,80 Q2,85 6,90 M6,95 Q2,100 6,105 M6,110 Q2,115 6,120 M6,125 Q2,130 6,135 M6,140 Q2,145 6,150" stroke="#D8B76A" strokeWidth="0.5" fill="none" opacity="0.75" />
        <line x1="94" y1="0" x2="94" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.75" />
        <path d="M94,5 Q98,10 94,15 M94,20 Q98,25 94,30 M94,35 Q98,40 94,45 M94,50 Q98,55 94,60 M94,65 Q98,70 94,75 M94,80 Q98,85 94,90 M94,95 Q98,100 94,105 M94,110 Q98,115 94,120 M94,125 Q98,130 94,135 M94,140 Q98,145 94,150" stroke="#D8B76A" strokeWidth="0.5" fill="none" opacity="0.75" />
        <path d="M22,30 L23,28 L25,27 L23,26 L22,24 L21,26 L19,27 L21,28 Z" fill="#FFFFFF" opacity="0.8" />
        <path d="M78,45 L79,43 L81,42 L79,41 L78,39 L77,41 L75,42 L77,43 Z" fill="#FFFFFF" opacity="0.8" />
      </svg>
    );
  }
  if (url === "/templates/template_pro_7.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <path d="M100,30 Q78,50 82,75 Q86,100 100,110" stroke="#D8B76A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <circle cx="85" cy="55" r="4" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" />
        <circle cx="85" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="80" cy="80" r="5" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" />
        <circle cx="80" cy="80" r="2" fill="#D8B76A" opacity="0.5" />
        <circle cx="45" cy="40" r="0.8" fill="#D8B76A" opacity="0.5" />
        <circle cx="35" cy="90" r="1" fill="#D8B76A" opacity="0.5" />
        <circle cx="65" cy="115" r="0.6" fill="#D8B76A" opacity="0.5" />
      </svg>
    );
  }
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
    customTextBoldness,
    setCustomTextBoldness,
    customTextAlign,
    setCustomTextAlign,
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

  const hasThemeChanges =
    cardTheme !== "floral" ||
    customCardBg !== "" ||
    customTextColor !== "#1A2E4A" ||
    customFontFamily !== "classic" ||
    customVerticalOffset !== 0 ||
    customHorizontalOffset !== 0 ||
    customTextSize !== 1.0 ||
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
    setCustomTextBoldness("normal");
    setCustomTextAlign("center");
    if (customBgInputRef && customBgInputRef.current) {
      customBgInputRef.current.value = "";
    }
    toast.success("Theme settings reset to defaults! Click 'Save Customizations' below to save changes.");
  };

  return (
    <div className="space-y-6">
      {/* Invitation Theme Options */}
      <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">2. Invitation Theme Layout</h3>
          {isFree && (
            <button
              type="button"
              onClick={() => { }}
              className="text-[9px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30"
            >
              Upgrade
            </button>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Theme Layout</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-[#0D1220] px-4 py-3 text-sm text-white focus:border-[#D8B76A]/60 outline-none"
            value={cardTheme}
            onChange={(e) => {
              const val = e.target.value;
              if (isFree && val !== "floral") {
                toast.warning("Upgrade to Plus or Pro plan to unlock custom themes!", { toastId: "theme-lock-free" });
                return;
              }
              if (isPlus && val === "custom") {
                toast.warning("Upgrade to Pro plan to unlock custom background design uploads!", { toastId: "theme-lock-plus" });
                return;
              }
              setCardTheme(val);
              setCustomTextColor(getSmartTextColor(val, customCardBg));
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
        // Adjust border styling to match live preview's visual cues per theme
        if (theme.value === "minimalist") {
          borderClass = "border-2 border-double border-[#2E3A59]/30";
        } else if (theme.value === "navy") {
          borderClass = "border border-[#D8B76A]";
        } else if (theme.value === "stardust" || theme.value === "forest") {
          borderClass = "border border-white/20";
        } else if (theme.value === "custom") {
          // Custom uploads use a simple border like the preview defaults
          borderClass = "border border-white/10";
        }

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
                previewStyle = { backgroundColor: "#0A1424" };
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
                    if (isLocked) {
                      toast.warning(isFree ? "Upgrade to Plus or Pro plan to unlock premium themes!" : "Upgrade to Pro plan to unlock custom card design uploads!", { toastId: "theme-tile-lock" });
                      return;
                    }
                    setCardTheme(theme.value);
                    setCustomTextColor(getSmartTextColor(theme.value, customCardBg));
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
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-1.5 z-10">
                      <span className="text-sm">🔒</span>
                      <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                        {theme.value === "custom" ? "Pro Only" : "Plus / Pro"}
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
                onChange={(e) => setCustomTextColor(e.target.value)}
              />
              <input
                type="text"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs outline-none focus:border-[#D8B76A]/60 text-white font-mono"
                value={customTextColor}
                onChange={(e) => setCustomTextColor(e.target.value)}
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
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${cardTheme === "plain"
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
              <div className="grid grid-cols-3 gap-2">
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
                      }}
                      className={`relative aspect-[2/3] rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-2 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:from-black/60 transition" />
                      <div className="text-left z-10 w-full">
                        <p className="text-[9px] font-bold text-white leading-tight mb-0.5 truncate">{t.name}</p>
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
              <div className="grid grid-cols-3 gap-2">
                {PREMADE_TEMPLATES.filter(t => t.tier === "plus").map(t => {
                  const isLocked = isFree;
                  const isSelected = cardTheme === "custom" && customCardBg === t.url;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          toast.warning("Upgrade to Plus or Pro plan to unlock Plus templates! 🔒", { toastId: "plus-template-lock" });
                          return;
                        }
                        setCustomCardBg(t.url);
                        setCardTheme("custom");
                        setCustomTextColor(getSmartTextColor("custom", t.url));
                        checkSmartAlignment(t.url);
                        const layout = getTemplateLayout("custom", t.url);
                        if (layout && layout.align) {
                          setCustomTextAlign(layout.align);
                        }
                      }}
                      className={`relative aspect-[2/3] rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-2 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:from-black/60 transition" />

                      {isLocked && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                          <span className="text-sm">🔒</span>
                          <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                            Plus / Pro
                          </span>
                        </div>
                      )}

                      <div className="text-left z-10 w-full">
                        <p className="text-[9px] font-bold text-white leading-tight mb-0.5 truncate">{t.name}</p>
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
              <div className="grid grid-cols-3 gap-2">
                {PREMADE_TEMPLATES.filter(t => t.tier === "pro").map(t => {
                  const isLocked = isFree || isPlus;
                  const isSelected = cardTheme === "custom" && customCardBg === t.url;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          toast.warning("Upgrade to Pro plan to unlock Pro templates! 🔒", { toastId: "pro-template-lock" });
                          return;
                        }
                        setCustomCardBg(t.url);
                        setCardTheme("custom");
                        setCustomTextColor(getSmartTextColor("custom", t.url));
                        checkSmartAlignment(t.url);
                        const layout = getTemplateLayout("custom", t.url);
                        if (layout && layout.align) {
                          setCustomTextAlign(layout.align);
                        }
                      }}
                      className={`relative aspect-[2/3] rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-2 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                        }`}
                      style={getTemplatePreviewStyles(t.url)}
                    >
                      {renderTemplatePreviewOrnaments(t.url)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:from-black/60 transition" />

                      {isLocked && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                          <span className="text-sm">🔒</span>
                          <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                            Pro Only
                          </span>
                        </div>
                      )}

                      <div className="text-left z-10 w-full">
                        <p className="text-[9px] font-bold text-white leading-tight mb-0.5 truncate">{t.name}</p>
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

        {/* Fine-Tuning Controls — Always visible for Pro, any theme */}
        {isPro && (
          <div className="space-y-4">
            <p className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">Fine-Tuning (Pro)</p>

            <div>
              <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                <span>Vertical position offset</span>
                <span className="font-mono text-[#D8B76A]">{customVerticalOffset}px</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A]"
                value={customVerticalOffset}
                onChange={(e) => setCustomVerticalOffset(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                <span>Horizontal position offset</span>
                <span className="font-mono text-[#D8B76A]">{customHorizontalOffset}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A]"
                value={customHorizontalOffset}
                onChange={(e) => setCustomHorizontalOffset(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                <span>Text Size scale multiplier</span>
                <span className="font-mono text-[#D8B76A]">{customTextSize}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A]"
                value={customTextSize}
                onChange={(e) => setCustomTextSize(Number(e.target.value))}
              />
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
                    onClick={() => setCustomTextBoldness(item.value)}
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
                    onClick={() => setCustomTextAlign(align)}
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
