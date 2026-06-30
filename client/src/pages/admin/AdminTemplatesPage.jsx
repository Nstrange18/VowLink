import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { SettingsProvider, useSettings } from "../../context/SettingsContext";
import { PREMADE_TEMPLATES, getTemplateLayout } from "../../utils/templateLayouts";
import AiBackgroundGenerator from "../../components/settings/AiBackgroundGenerator";
import { Icon } from "@iconify/react";

const AdminTemplatesPageContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    storedUser,
    isFree,
    isPlus,
    cardTheme,
    setCardTheme,
    customCardBg,
    setCustomCardBg,
    savedCardBg,
    savedCardTheme,
    setCustomTextColor,
    setCustomTextAlign,
    setUserHasCustomTextColor,
    setUserHasCustomAlignment,
    getSmartTextColor,
    watch,
    onSubmit,
    isSubmitting,
  } = useSettings();

  React.useEffect(() => {
    if (location.hash === "#ai-backgrounds") {
      // Small timeout to ensure DOM is fully rendered before scrolling
      const timer = setTimeout(() => {
        const element = document.getElementById("ai-backgrounds");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  // Modal state for locked upgrade prompt
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState("");

  const hasUnsavedChanges = customCardBg !== savedCardBg || cardTheme !== savedCardTheme;

  const handleSelectTemplate = (template) => {
    const isLocked =
      (isFree && template.tier !== "free") ||
      (isPlus && template.tier === "pro");

    if (isLocked) {
      setTargetTier(template.tier === "pro" ? "Pro" : "Plus / Pro");
      setUpgradeModalOpen(true);
      return;
    }

    // Update settings context states
    setCustomCardBg(template.url);
    setCardTheme("custom");
    
    // Automatically optimize smart alignment & text colors
    const smartColor = getSmartTextColor("custom", template.url);
    setCustomTextColor(smartColor);
    setUserHasCustomTextColor(false);

    const layout = getTemplateLayout("custom", template.url);
    if (layout && layout.align) {
      setCustomTextAlign(layout.align);
      setUserHasCustomAlignment(false); // Reset custom alignment override to use layout config defaults
    }

    toast.info(`Selected "${template.name}". Click Save below to apply to invitation!`, {
      toastId: "template-selected",
    });
  };

  const handleResetToPlain = () => {
    setCustomCardBg("");
    setCardTheme("plain");
    
    const smartColor = getSmartTextColor("plain", "");
    setCustomTextColor(smartColor);
    setUserHasCustomTextColor(false);
    setCustomTextAlign("center");
    setUserHasCustomAlignment(false);

    toast.info("Selected Plain solid background template.", {
      toastId: "template-selected-plain",
    });
  };

  const handleSaveChanges = async () => {
    try {
      //onSubmit expects the form values from react-hook-form
      await onSubmit(watch());
    } catch (err) {
      console.error("Failed to save template changes:", err);
    }
  };

  const handleCancelChanges = () => {
    setCustomCardBg(savedCardBg);
    setCardTheme(savedCardTheme);
    
    // Reset to last saved states
    setCustomTextColor(storedUser.customTextColor || "#1A2E4A");
    setUserHasCustomTextColor(storedUser.userHasCustomTextColor || false);
    setCustomTextAlign(storedUser.customTextAlign || "center");
    setUserHasCustomAlignment(storedUser.userHasCustomAlignment || false);

    toast.info("Changes discarded.");
  };

  // Group templates by tier
  const freeTemplates = PREMADE_TEMPLATES.filter((t) => t.tier === "free");
  const plusTemplates = PREMADE_TEMPLATES.filter((t) => t.tier === "plus");
  const proTemplates = PREMADE_TEMPLATES.filter((t) => t.tier === "pro");

  const renderTemplateCard = (t) => {
    const isCurrentlySaved = savedCardTheme === "custom" && savedCardBg === t.url;
    const isSelectedPendingSave = cardTheme === "custom" && customCardBg === t.url && !isCurrentlySaved;
    const isSelected = isCurrentlySaved || isSelectedPendingSave;
    const isLocked =
      (isFree && t.tier !== "free") ||
      (isPlus && t.tier === "pro");

    // Tier specific card styling
    let cardStyle = "border-white/10 bg-slate-950/20";
    let badgeStyle = "bg-white/10 text-white/70 border border-white/20";

    if (t.tier === "free") {
      cardStyle = isSelected
        ? "border-[#D8B76A] ring-2 ring-[#D8B76A] bg-[#D8B76A]/5"
        : "border-slate-800 hover:border-slate-700 bg-slate-900/40";
      badgeStyle = "bg-slate-500/10 text-slate-400 border border-slate-500/30";
    } else if (t.tier === "plus") {
      cardStyle = isSelected
        ? "border-[#7FA6D9] ring-2 ring-[#7FA6D9] bg-[#7FA6D9]/5"
        : "border-blue-900/30 hover:border-blue-900/60 bg-blue-950/10 shadow-[0_4px_12px_rgba(30,58,138,0.15)]";
      badgeStyle = "bg-[#7FA6D9]/10 text-[#7FA6D9] border border-[#7FA6D9]/30";
    } else if (t.tier === "pro") {
      cardStyle = isSelected
        ? "border-[#D8B76A] ring-2 ring-[#D8B76A] bg-[#D8B76A]/5 shadow-[0_0_20px_rgba(216,183,106,0.15)]"
        : "border-amber-950/20 hover:border-amber-950/50 bg-amber-950/5 shadow-[0_8px_20px_rgba(216,183,106,0.05)]";
      badgeStyle = "bg-linear-to-r from-amber-400 to-yellow-500 text-[#070A13] font-bold shadow-[0_0_12px_rgba(250,204,21,0.25)]";
    }

    return (
      <div
        key={t.name}
        className={`template-gallery-card group relative rounded-2xl border p-3 flex flex-col transition-all duration-300 ${cardStyle} ${
          isLocked ? "opacity-85" : "hover:-translate-y-1"
        }`}
      >
        {/* Template Image */}
        <div className="template-gallery-image relative aspect-[608/580] w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner">
          <img
            src={t.preview}
            alt={t.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent opacity-60" />

          {/* Plan badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full text-center ${badgeStyle}`}>
              {t.tier}
            </span>
          </div>

          {/* Locked State Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
              <Icon icon="lucide:lock" className="text-3xl text-amber-400 mb-2 animate-bounce" />
              <p className="text-sm font-serif text-[#D8B76A] font-bold uppercase tracking-wider">
                {t.tier === "pro" ? "Pro Plan Only" : "Plus / Pro Plan"}
              </p>
              <p className="text-[10px] text-white/50 mt-1 max-w-[150px] leading-relaxed">
                Click to unlock and review premium packages
              </p>
            </div>
          )}

          {/* Active selection badge */}
          {isCurrentlySaved && (
            <div className="absolute top-3 right-3 bg-[#D8B76A] text-[#070A13] text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md shadow-[#D8B76A]/20">
              Active Design
            </div>
          )}
          {isSelectedPendingSave && (
            <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md animate-pulse">
              Selected
            </div>
          )}
        </div>

        {/* Info & Select button */}
        <div className="mt-3 flex-1 flex flex-col justify-between">
          <div className="mb-3 text-left">
            <h4 className="text-xs font-bold font-serif text-white tracking-wide">{t.name}</h4>
            <p className="text-[9px] text-white/40 mt-0.5 uppercase tracking-widest">Pre-made template</p>
          </div>

          {isCurrentlySaved ? (
            <div className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#D8B76A] border border-[#D8B76A]/30 bg-[#D8B76A]/10 flex items-center justify-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8B76A] animate-ping" />
              <span className="inline-flex items-center gap-1">
                In Use <Icon icon="lucide:check" className="h-3.5 w-3.5" />
              </span>
            </div>
          ) : isSelectedPendingSave ? (
            <button
              type="button"
              onClick={() => handleSelectTemplate(t)}
              className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#D8B76A] text-[#070A13] cursor-pointer shadow-md"
            >
              Selected (Unsaved) ⏳
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectTemplate(t)}
              className={`w-full py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isLocked
                  ? "bg-amber-400/10 border border-amber-400/20 text-[#D8B76A] hover:bg-amber-400/25"
                  : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
              }`}
            >
              {isLocked ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  Unlock Design <Icon icon="lucide:lock" className="h-3.5 w-3.5" />
                </span>
              ) : "Use Template"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const WEDDING_COLORS = [
    { name: "Burgundy", hex: "#800020" },
    { name: "Emerald Green", hex: "#004B23" },
    { name: "Navy Blue", hex: "#0A1128" },
    { name: "Royal Blue", hex: "#1D3557" },
    { name: "Teal", hex: "#006466" },
    { name: "Hunter Green", hex: "#1A3A2B" },
    { name: "Dusty Blue", hex: "#8E9AAF" },
    { name: "Sage Green", hex: "#9DBEBB" },
    { name: "Mint Green", hex: "#E8F1F2" },
    { name: "Lilac", hex: "#C8B6E2" },
    { name: "Lavender", hex: "#E8D7F1" },
    { name: "Plum", hex: "#4A154B" },
    { name: "Dusty Rose", hex: "#DCAE96" },
    { name: "Blush Pink", hex: "#F3C68F" },
    { name: "Coral", hex: "#F26419" },
    { name: "Peach", hex: "#FDE24F" },
    { name: "Terracotta", hex: "#E76F51" },
    { name: "Rust", hex: "#BC4749" },
    { name: "Mustard Gold", hex: "#E9C46A" },
    { name: "Champagne Gold", hex: "#F4A261" },
    { name: "Bronze", hex: "#B58A63" },
    { name: "Chocolate Brown", hex: "#4D382A" },
    { name: "Taupe", hex: "#A8A297" },
    { name: "Cream", hex: "#F7F5F0" },
    { name: "Ivory", hex: "#FFFFF0" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Silver", hex: "#E2E8F0" },
    { name: "Charcoal Grey", hex: "#2E3A59" },
    { name: "Midnight Black", hex: "#070A13" },
  ];

  return (
    <div className="templates-gallery-page p-4 sm:p-8 max-w-6xl mx-auto text-white pb-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/settings"
            className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] hover:underline flex items-center gap-1.5 mb-2"
          >
            <Icon icon="lucide:arrow-left" className="w-3 h-3 text-[#D8B76A]" /> Back to Settings
          </Link>
          <h2 className="font-serif text-3xl sm:text-4xl">Themes & Templates Gallery</h2>
          <p className="text-white/40 text-xs sm:text-sm mt-1 leading-relaxed">
            Browse all our gorgeous pre-made invitation layouts. Select a design matching your wedding aesthetics.
          </p>
        </div>

        {/* Plain background choice option */}
        <button
          type="button"
          onClick={handleResetToPlain}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition cursor-pointer shrink-0 ${
            cardTheme === "plain"
              ? "bg-[#D8B76A] text-[#070A13] border-[#D8B76A] font-bold"
              : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
          }`}
        >
          Plain Background (No Design)
        </button>
      </div>

      <div className="space-y-12">
        {/* Tier 1: Free Templates */}
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-2">
              <Icon icon="lucide:flower" className="w-4 h-4 text-emerald-400 shrink-0" /> Free Tier Templates
              <span className="text-[9px] lowercase font-normal tracking-wide text-white/40">
                (Unlocked for everyone)
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {freeTemplates.map(renderTemplateCard)}
          </div>
        </div>

        {/* Tier 2: Plus Templates */}
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#7FA6D9] flex items-center gap-2">
              <Icon icon="lucide:star" className="w-4 h-4 text-blue-400 shrink-0" /> Plus Tier Templates
              {isFree && (
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                  Upgrade to Unlock
                </span>
              )}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {plusTemplates.map(renderTemplateCard)}
          </div>
        </div>

        {/* Tier 3: Pro Templates */}
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#F2D894] flex items-center gap-2">
              <Icon icon="lucide:gem" className="w-4 h-4 text-amber-400 shrink-0" /> Pro Tier Luxury Templates
              {(isFree || isPlus) && (
                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Upgrade to Unlock
                </span>
              )}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {proTemplates.map(renderTemplateCard)}
          </div>
        </div>

        {/* AI Invitation Background Generator */}
        <div className="space-y-4" id="ai-backgrounds">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-2">
              <Icon icon="lucide:sparkles" className="w-4 h-4 text-[#D8B76A] shrink-0 animate-pulse" /> AI Generated Backgrounds
              <span className="text-[9px] lowercase font-normal tracking-wide text-white/40">
                (Plus & Pro feature — unique to your wedding)
              </span>
            </h3>
          </div>
          <AiBackgroundGenerator />
        </div>
      </div>

      {/* Spacer to prevent floating action bar from blocking content */}
      <div className="h-10 w-full" />

      {/* Floating Save/Cancel changes bar */}
      {hasUnsavedChanges && (
        <div className="template-save-bar fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0D1220]/95 backdrop-blur-md border border-[#D8B76A]/40 px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-[92%] max-w-xl animate-fade-in border-l-4 border-l-[#D8B76A]">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold text-white">Unsaved template customizations</p>
            <p className="text-[10px] text-white/50 mt-0.5">Click save to apply your selection to your invitation card.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs text-white/60 bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-[#070A13] transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="animate-spin text-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal Prompt */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1220] p-6 shadow-2xl relative animate-fade-in">
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white text-lg cursor-pointer"
            >
              <Icon icon="lucide:x" className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="flex justify-center">
                <Icon icon="lucide:crown" className="text-4xl text-[#D8B76A] mb-2 animate-pulse" />
              </div>
              <h3 className="font-serif text-2xl text-[#D8B76A] mt-3 uppercase tracking-wide">
                Unlock Premium Template
              </h3>
              <p className="text-xs text-white/60 mt-2">
                This gorgeous design is exclusive to users on the <strong className="text-white">{targetTier}</strong> tier plan. Upgrade today to unlock this template and all corresponding premium features:
              </p>
            </div>

            {/* Premium details list */}
            <div className="mt-5 space-y-2.5 bg-white/5 border border-white/5 p-4 rounded-xl text-left">
              {[
                { label: "Full-Length Soundtrack Music Integration", icon: "lucide:music" },
                { label: "Portrait Backdrop Image Overlay & Opacity Slider", icon: "lucide:image" },
                { label: "Interactive, Beautiful Event Day Timeline Stepper", icon: "lucide:clock" },
                { label: "Gift Registry Transfer Details Integration", icon: "lucide:gift" },
                { label: "Complete Design Font & Text Fine-Tuning Controls", icon: "lucide:sliders" },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center gap-2 text-left">
                  <Icon icon={feat.icon} className="w-3.5 h-3.5 text-[#D8B76A] shrink-0" />
                  <span className="text-[10px] leading-relaxed text-white/80">{feat.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setUpgradeModalOpen(false);
                  navigate("/admin/billing");
                }}
                className="w-full py-3 rounded-xl bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-xs font-bold uppercase tracking-widest text-[#070A13] shadow-lg transition cursor-pointer"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  Upgrade Plan Now <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white transition cursor-pointer"
              >
                Close & Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminTemplatesPage = () => {
  return (
    <SettingsProvider>
      <AdminTemplatesPageContent />
    </SettingsProvider>
  );
};

export default AdminTemplatesPage;
