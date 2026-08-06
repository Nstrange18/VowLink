import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Controller } from "react-hook-form";
import { toast } from "react-toastify";
import ColorPicker from "../../components/ColorPicker";
import CustomSelect from "../../components/CustomSelect";
import InternationalPhoneInput from "../../components/InternationalPhoneInput";
import { SettingsProvider, useSettings } from "../../context/SettingsContext";
import InvitationCardPreview from "../../components/settings/InvitationCardPreview";
import ThemeSelector from "../../components/settings/ThemeSelector";
import MusicSelector from "../../components/settings/MusicSelector";
import ImageEditorModal from "../../components/ImageEditorModal";
import { Icon } from "@iconify/react";
import api from "../../utils/api";
import { PREMADE_TEMPLATES } from "../../utils/templateLayouts";
import PageMiniTour from "../../components/PageMiniTour";

const SETTINGS_TOUR_STEPS = [
  {
    target: '[data-tour="settings-header"]',
    title: "Settings workspace",
    body: "Use this page to update wedding details, invitation design, media, registry, and account security.",
  },
  {
    target: '[data-tour="settings-tabs"]',
    title: "Settings sections",
    body: "Switch between details, design, music, registry, and security without leaving the page.",
  },
  {
    target: '[data-tour="settings-workspace"]',
    title: "Edit your invitation",
    body: "Make changes here. Some design tools are plan-limited, but you can preview templates before saving.",
  },
  {
    target: '[data-tour="settings-preview"]',
    title: "Live preview",
    body: "This preview updates as you edit so you can check spacing, colors, and wording before saving.",
  },
  {
    target: '[data-tour="settings-save"]',
    title: "Save changes",
    body: "Save applies your latest details and design choices to the live invitation pages.",
  },
];

const getTemplateColourDefaults = (cardTheme, customCardBg = "") => {
  const source = `${cardTheme || ""} ${customCardBg || ""}`.toLowerCase();
  if (source.includes("burgundy") || source.includes("rose")) return ["Burgundy", "Blush Pink", "Gold"];
  if (source.includes("emerald") || source.includes("forest") || source.includes("eucalyptus")) return ["Emerald Green", "Gold", "Ivory"];
  if (source.includes("navy") || source.includes("blue")) return ["Royal Blue", "Champagne Gold", "Ivory"];
  if (source.includes("blush") || source.includes("pink")) return ["Blush Pink", "Rose Gold", "Ivory"];
  if (source.includes("cream") || source.includes("linen") || source.includes("minimalist")) return ["Sage Green", "Cream", "Nude"];
  if (source.includes("terracotta") || source.includes("peach")) return ["Terracotta", "Peach", "Cream"];
  if (source.includes("midnight") || source.includes("black") || source.includes("stardust") || source.includes("gold")) {
    return ["Champagne Gold", "Ivory", "Midnight Black"];
  }
  return ["Champagne Gold", "Ivory", "Midnight Black"];
};

const SETTINGS_TAB_GUIDES = {
  details: {
    icon: "lucide:calendar-heart",
    eyebrow: "Wedding details",
    title: "Start with the information guests must trust.",
    body: "Confirm names, date, venue, dress code, timeline, and the wording that appears on the invitation before you share links widely.",
    steps: [
      "Check the couple names and wedding date.",
      "Add venue, address, time, and dress code.",
      "Build the event timeline in the order guests should follow.",
    ],
    reminder: "Save after editing so invitation links show the latest details.",
  },
  design: {
    icon: "lucide:palette",
    eyebrow: "Design and theme",
    title: "Make the invitation feel like the wedding.",
    body: "Choose the card style, colors, fonts, and couple photo. Keep contrast clear so guests can read the invitation easily on mobile.",
    steps: [
      "Pick a template that matches the wedding mood.",
      "Set readable colors before adding decorative details.",
      "Use the live preview to check spacing before saving.",
    ],
    reminder:
      "Some templates are plan-limited; preview first, then upgrade only if needed.",
  },
  media: {
    icon: "lucide:music-2",
    eyebrow: "Media and music",
    title: "Add emotion without slowing the invite down.",
    body: "Use music and photos to make the invitation more personal. Keep files clean and test the preview after uploads.",
    steps: [
      "Choose or upload the song guests should hear.",
      "Add clear couple photos or gallery images.",
      "Test the invite on mobile after changing media.",
    ],
    reminder: "Large files can take longer to upload on weak networks.",
  },
  registry: {
    icon: "lucide:gift",
    eyebrow: "Gift registry",
    title: "Make gifting simple and clear.",
    body: "Add only the account or registry details guests need. Keep the message polite, short, and easy to understand.",
    steps: [
      "Turn gifting on only when the details are ready.",
      "Confirm bank name, account name, and account number.",
      "Write a short note for guests who want to send gifts.",
    ],
    reminder: "Double-check account details before saving.",
  },
  security: {
    icon: "lucide:shield-check",
    eyebrow: "Security",
    title: "Protect access before the event gets busy.",
    body: "Update passwords, manage check-in PIN access, and keep account deletion separate from normal invitation editing.",
    steps: [
      "Use a strong password that is not shared with staff.",
      "Create a check-in PIN only for trusted ushers.",
      "Disable or reset the PIN if it was shared wrongly.",
    ],
    reminder:
      "Security changes take effect immediately after saving or confirming.",
  },
};

const SettingsTabGuide = ({ guide }) => {
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

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-500/8 px-3 py-2.5 text-xs leading-relaxed text-emerald-500">
        <Icon icon="lucide:info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{guide.reminder}</span>
      </div>
    </section>
  );
};

const TIMELINE_ICONS = [
  { icon: "mdi:church", label: "Church/Ceremony" },
  { icon: "mdi:ring", label: "Exchange of Rings" },
  { icon: "lucide:camera", label: "Photoshoot" },
  { icon: "mdi:glass-cocktail", label: "Cocktail / Toast" },
  { icon: "mdi:silverware-fork-knife", label: "Dinner / Buffet" },
  { icon: "mdi:cake-variant-outline", label: "Cake Cutting" },
  { icon: "mdi:dance-ballroom", label: "Dance Floor" },
  { icon: "mdi:car", label: "Send Off" },
];

const TimelineBuilder = ({ timeline, setTimeline }) => {
  const [time, setTime] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("mdi:ring");

  const handleAddEvent = () => {
    if (!time || !title) {
      toast.warning("Time and Event Title are required.");
      return;
    }
    const newItem = { time, title, description, icon };
    const newTimeline = [...timeline, newItem].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    setTimeline(newTimeline);
    setTime("");
    setTitle("");
    setDescription("");
    setIcon("mdi:ring");
    toast.success("Event added to timeline! Remember to save customizations.");
  };

  const handleRemoveEvent = (index) => {
    const newTimeline = timeline.filter((_, idx) => idx !== index);
    setTimeline(newTimeline);
    toast.info("Event removed from timeline.");
  };

  return (
    <div className="space-y-4">
      {timeline.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {timeline.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <Icon
                  icon={item.icon?.includes(":") ? item.icon : "mdi:ring"}
                  className="h-5 w-5 shrink-0 text-[#D8B76A]"
                />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {item.time} - {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEvent(index)}
                className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-white/5 transition"
              >
                <Icon icon="lucide:x" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/3 border border-white/5 p-4 rounded-xl space-y-4">
        <p className="text-[10px] uppercase tracking-wider text-[#D8B76A] font-bold">
          + Add Timeline Event
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Toast & Reception"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-1">
            Description / Location (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Garden Reception / Ballroom"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
          />
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-2">
            Select Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_ICONS.map((i) => (
              <button
                key={i.icon}
                type="button"
                onClick={() => setIcon(i.icon)}
                className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center border transition-all ${
                  icon === i.icon
                    ? "bg-[#D8B76A]/20 border-[#D8B76A] text-white"
                    : "bg-[#070A13] border-white/10 text-white/60 hover:border-white/30"
                }`}
                title={i.label}
              >
                <Icon icon={i.icon} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddEvent}
          className="w-full py-2 rounded-xl bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-xs font-semibold uppercase tracking-wider transition"
        >
          Add Event to List
        </button>
      </div>
    </div>
  );
};

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
const inputErr = "border-red-400/50";
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`;

const AdminSettingsPageContent = () => {
  const navigate = useNavigate();
  const {
    storedUser,
    isUnpaid,
    isFree,
    isPlus,
    isPro,

    customBgInputRef,
    couplePhotoInputRef,

    weddingColors,
    setWeddingColors,
    cardTheme,
    customCardBg,
    savedCardBg,
    savedCardTheme,
    customTextColor,
    setCustomTextColor,
    setUserHasCustomTextColor,
    couplePhotoUrl,
    setCouplePhotoUrl,
    customShareMessage,
    setCustomShareMessage,
    setCropperQueue,
    cropperOpen,
    setCropperOpen,
    cropperImageSrc,
    cropperTitle,
    cropperDefaultAspect,
    cropperCallback,
    coupleOverlayOpacity,
    setCoupleOverlayOpacity,
    registryEnabled,
    setRegistryEnabled,
    registryBankName,
    setRegistryBankName,
    registryAccountName,
    setRegistryAccountName,
    registryAccountNumber,
    setRegistryAccountNumber,
    registryNotes,
    setRegistryNotes,
    timeline,
    setTimeline,
    gifts,

    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    submittingPassword,
    handleChangePassword,

    showDeleteConfirm,
    setShowDeleteConfirm,
    deletePassword,
    setDeletePassword,
    submittingDelete,
    handleDeleteAccount,

    activeTab,
    setActiveTab,
    showResetConfirm,
    setShowResetConfirm,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,

    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    onSubmit,
    onInvalid,
    hasUnsavedSettingsChanges,
    hasTemplatePreviewChanges,
    changedSettingsSections,
    restoreSavedTemplate,

    handleCustomCardBgUpload,
    handleCouplePhotoUpload,
    handleResetAll,
    handleResetConfirm,

    weddingDate,
    weddingTime,
  } = useSettings();
  const previewTemplateTier = PREMADE_TEMPLATES.find(
    (template) => template.url === customCardBg,
  )?.tier;
  const hasPendingTemplatePreview =
    cardTheme === "custom" &&
    Boolean(customCardBg) &&
    (savedCardTheme !== "custom" || savedCardBg !== customCardBg);
  const hasLockedTemplatePreview =
    hasPendingTemplatePreview &&
    ((isUnpaid && previewTemplateTier === "free") ||
      (isFree && previewTemplateTier !== "free") ||
      (isPlus && previewTemplateTier === "pro"));
  const lockedTemplatePlanLabel =
    !previewTemplateTier || previewTemplateTier === "pro"
      ? "Upgrade to Pro"
      : previewTemplateTier === "plus"
        ? "Upgrade to Plus"
        : "Activate Classic";
  const changedSettingsLabel = changedSettingsSections.length
    ? changedSettingsSections.join(", ")
    : "settings";

  const [showCouplePortrait, setShowCouplePortrait] = React.useState(true);
  const [showSocialShare, setShowSocialShare] = React.useState(false);
  const [checkInPin, setCheckInPin] = React.useState("");
  const [checkInPinStatus, setCheckInPinStatus] = React.useState({
    enabled: false,
    updatedAt: null,
  });
  const [loadingCheckInPin, setLoadingCheckInPin] = React.useState(false);
  const [savingCheckInPin, setSavingCheckInPin] = React.useState(false);
  const [disablingCheckInPin, setDisablingCheckInPin] = React.useState(false);
  const location = useLocation();
  const activeSettingsGuide =
    SETTINGS_TAB_GUIDES[activeTab] || SETTINGS_TAB_GUIDES.details;

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location, setActiveTab]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get("section");
    if (activeTab !== "design" || sectionParam !== "colours") return;
    window.setTimeout(() => {
      document
        .querySelector('[data-section="colours"]')
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [activeTab, location.search]);

  React.useEffect(() => {
    const loadCheckInPinStatus = async () => {
      setLoadingCheckInPin(true);
      try {
        const res = await api.get("/auth/check-in-pin");
        setCheckInPinStatus({
          enabled: Boolean(res.data?.enabled),
          updatedAt: res.data?.updatedAt || null,
        });
      } catch {
        setCheckInPinStatus({ enabled: false, updatedAt: null });
      } finally {
        setLoadingCheckInPin(false);
      }
    };

    loadCheckInPinStatus();
  }, []);

  const handleSaveCheckInPin = async () => {
    if (isFree) {
      toast.info("Event check-in PINs are available on Plus and Pro plans.");
      navigate("/admin/billing");
      return;
    }

    const normalizedPin = checkInPin.trim();
    if (!/^\d{4,8}$/.test(normalizedPin)) {
      toast.info("Use a 4 to 8 digit check-in PIN.");
      return;
    }

    setSavingCheckInPin(true);
    try {
      const res = await api.put("/auth/check-in-pin", { pin: normalizedPin });
      setCheckInPin("");
      setCheckInPinStatus({
        enabled: Boolean(res.data?.enabled),
        updatedAt: res.data?.updatedAt || new Date().toISOString(),
      });
      toast.success(res.data?.message || "Check-in PIN updated.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update check-in PIN.",
      );
    } finally {
      setSavingCheckInPin(false);
    }
  };

  const handleDisableCheckInPin = async () => {
    if (isFree) {
      toast.info("Event check-in PINs are available on Plus and Pro plans.");
      navigate("/admin/billing");
      return;
    }

    setDisablingCheckInPin(true);
    try {
      const res = await api.delete("/auth/check-in-pin");
      setCheckInPin("");
      setCheckInPinStatus({ enabled: false, updatedAt: null });
      toast.success(res.data?.message || "Check-in PIN disabled.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to disable check-in PIN.",
      );
    } finally {
      setDisablingCheckInPin(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-clip px-4 py-4 pb-36 text-white sm:px-8 sm:py-8 sm:pb-36">
      <div className="settings-page-header -mx-4 mb-8 border-b border-white/10 bg-[#070A13]/96 px-4 pt-4 pb-4 sm:-mx-8 sm:px-8 sm:pt-6">
        <div data-tour="settings-header" className="mb-6 min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">
            Account
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            Settings & Customization
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Customize your wedding invitation card appearance, photo gallery,
            dress code, and venue preferences.
          </p>
          <PageMiniTour
            title="Settings tour"
            storageKey="vowlink-tour-settings"
            steps={SETTINGS_TOUR_STEPS}
            className="mt-4"
          />
        </div>

        {/* Glassmorphic Tabs Selector */}
        <div
          data-tour="settings-tabs"
          className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2"
        >
          {[
            {
              id: "details",
              label: "Details",
              fullLabel: "Wedding Details",
              icon: "lucide:calendar-days",
            },
            {
              id: "design",
              label: "Design",
              fullLabel: "Design & Theme",
              icon: "lucide:palette",
            },
            {
              id: "media",
              label: "Music",
              fullLabel: "Media & Music",
              icon: "lucide:music",
            },
            {
              id: "registry",
              label: "Registry",
              fullLabel: "Gift Registry",
              icon: "lucide:gift",
            },
            {
              id: "security",
              label: "Security",
              fullLabel: "Security & Danger Zone",
              icon: "lucide:lock",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "security") {
                  setShowDeleteConfirm(false);
                }
              }}
              className={`min-w-0 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[#D8B76A] text-[#070A13] shadow-[0_8px_20px_rgba(216,183,106,0.25)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Icon icon={tab.icon} className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Live Preview Indicator */}
      {activeTab !== "security" && (
        <div className="mb-6 flex min-w-0 items-start justify-between gap-3 rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-3 py-3 text-xs text-white/80 animate-pulse lg:hidden">
          <div className="flex min-w-0 items-start gap-2">
            <Icon
              icon="lucide:eye"
              className="text-[#D8B76A] w-4 h-4 shrink-0"
            />
            <span className="min-w-0 leading-relaxed">
              Live changes are updating on the card below
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("live-card-preview")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex shrink-0 items-center gap-1 text-right text-[10px] font-bold uppercase leading-tight text-[#D8B76A] hover:underline"
          >
            <span>Preview</span>
            <Icon icon="lucide:arrow-down" className="w-3 h-3 text-[#D8B76A]" />
          </button>
        </div>
      )}

      {/* Hidden file input for quick custom card design triggers from the preview */}
      <input
        ref={customBgInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomCardBgUpload}
        className="hidden"
      />

      <div
        data-tour="settings-workspace"
        className="grid min-w-0 grid-cols-1 items-start gap-6 overflow-x-clip lg:grid-cols-12 lg:gap-8"
      >
        {/* LEFT COLUMN: Tabs/Forms container */}
        <div
          className={`col-span-12 ${activeTab === "security" ? "lg:col-span-12" : "lg:col-span-6"} space-y-6 min-w-0 lg:pr-2`}
        >
          <SettingsTabGuide guide={activeSettingsGuide} />

          {/* Main Form for Details, Design, Media, and Registry settings */}
          {(activeTab === "details" ||
            activeTab === "design" ||
            activeTab === "media" ||
            activeTab === "registry") && (
            <form
              id="settings-customization-form"
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              className="min-w-0 space-y-8 animate-fade-in"
            >
              {/* TAB 1: Wedding Details */}
              {activeTab === "details" && (
                <div className="w-full">
                  <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">
                      1. Wedding Metadata
                    </h3>

                    {/* Partner names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Partner 1 *
                        </label>
                        <input
                          id="settings-p1"
                          {...register("partner1Name")}
                          className={cls(errors.partner1Name)}
                        />
                        {errors.partner1Name && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.partner1Name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Partner 2 *
                        </label>
                        <input
                          id="settings-p2"
                          {...register("partner2Name")}
                          className={cls(errors.partner2Name)}
                        />
                        {errors.partner2Name && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.partner2Name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                        Couple Phone Number
                      </label>
                      <Controller
                        name="couplePhone"
                        control={control}
                        render={({ field }) => (
                          <InternationalPhoneInput
                            id="settings-couple-phone"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.couplePhone}
                          />
                        )}
                      />
                      {errors.couplePhone && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.couplePhone.message}
                        </p>
                      )}
                      <p className="mt-1 text-[9px] text-white/30">
                        Optional. Used as the couple contact number for
                        follow-up and admin tools.
                      </p>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Wedding Date
                        </label>
                        <input
                          id="settings-wedding-date"
                          type="date"
                          {...register("weddingDate")}
                          className={`${cls(false)} scheme-dark text-xs`}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Wedding Time
                        </label>
                        <input
                          id="settings-wedding-time"
                          type="time"
                          {...register("weddingTime")}
                          className={`${cls(false)} scheme-dark text-xs`}
                        />
                        {weddingTime && (
                          <p className="mt-1.5 text-xs text-[#D8B76A] font-semibold">
                            Formatted Display:{" "}
                            {new Date(
                              `1970-01-01T${weddingTime}:00`,
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}
                        <p className="mt-1 text-[9px] text-white/30">
                          Invitations display time in 12-hr format (e.g. 2:00
                          PM)
                        </p>
                      </div>
                    </div>

                    {/* RSVP Deadline */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                        RSVP Deadline
                      </label>
                      <input
                        id="settings-rsvp-deadline"
                        type="date"
                        {...register("rsvpDeadline")}
                        max={weddingDate || undefined}
                        className={`${cls(false)} scheme-dark text-xs`}
                      />
                    </div>

                    {/* Ceremony Venue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Ceremony Name
                        </label>
                        <input
                          id="settings-venue-name"
                          placeholder="e.g. The Grand Ballroom"
                          {...register("venueName")}
                          className={cls(false)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Ceremony Address (Linked to Maps)
                        </label>
                        <input
                          id="settings-venue"
                          placeholder="e.g. 123 Lekki Ave, Lagos"
                          {...register("venue")}
                          className={cls(false)}
                        />
                      </div>
                    </div>

                    {/* Reception Venue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Reception Name
                        </label>
                        <input
                          id="settings-reception-name"
                          placeholder="e.g. Reception Gardens"
                          {...register("receptionName")}
                          className={cls(false)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                          Reception Address (Linked to Maps)
                        </label>
                        <input
                          id="settings-reception-location"
                          placeholder="e.g. Victoria Island, Lagos"
                          {...register("receptionLocation")}
                          className={cls(false)}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 bg-[#D8B76A]/5 border border-[#D8B76A]/20 p-3 rounded-xl flex items-start gap-2">
                      <Icon
                        icon="lucide:alert-triangle"
                        className="text-xs mt-0.5 text-[#D8B76A]"
                      />
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        <strong className="text-[#D8B76A]">
                          Location Precision:
                        </strong>{" "}
                        When adding locations, please be as precise as possible
                        (include specific hall name, street address, or major
                        landmarks). Guests will use these descriptions to look
                        up routes and direct maps.
                      </p>
                    </div>

                    {/* Dress Code */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                        Dress Code
                      </label>
                      <input
                        id="settings-dress-code"
                        placeholder="e.g. Black Tie / Emerald Gold"
                        {...register("dressCode")}
                        className={cls(false)}
                      />
                    </div>

                    {/* Guest Policies */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#D8B76A]">
                          Plus One Limit
                        </label>
                        <Controller
                          name="plusOnePolicy"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              name={field.name}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              options={[
                                {
                                  value: "invitation_only",
                                  label: "Strictly by invitation",
                                },
                                {
                                  value: "plus_one_allowed",
                                  label: "Plus one allowed",
                                },
                              ]}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-widest text-white/50">
                          Kids Allowed
                        </label>
                        <input
                          type="checkbox"
                          {...register("kidsAllowed")}
                          className="h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                      </div>
                    </div>

                    {/* Wedding Timeline Builder */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D8B76A]">
                          ⏳ Wedding Day Timeline
                        </h4>
                        <p className="text-[10px] text-white/40 mt-1">
                          Build a schedule of events for your wedding day. This
                          will render as a beautiful, animated timeline stepper
                          on your invitation.
                        </p>
                      </div>
                      <TimelineBuilder
                        timeline={timeline}
                        setTimeline={setTimeline}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Design & Theme */}
              {activeTab === "design" && (
                <div className="space-y-6">
                  <ThemeSelector />

                  <div className="settings-colour-panel min-w-0 rounded-2xl border border-[#D8B76A]/20 bg-[#111827] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-5">
                    <ColorPicker
                      value={weddingColors}
                      onChange={setWeddingColors}
                      textColor={customTextColor}
                      hasUnsavedChanges={changedSettingsSections.includes("design")}
                      templateColours={getTemplateColourDefaults(cardTheme, customCardBg)}
                      onUseRecommendedTextColor={(color) => {
                        setCustomTextColor(color);
                        setUserHasCustomTextColor(true);
                        toast.info("Readable text colour applied. Save changes to publish it.");
                      }}
                    />
                  </div>

                  {/* AI Invitation Background Generator — teaser linking to Templates page */}
                  <div className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-[#D8B76A]/25 bg-[#111827] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-5 space-y-4">
                    {/* shimmer gradient decoration */}
                    <div className="absolute inset-0 bg-linear-to-br from-[#D8B76A]/5 via-transparent to-transparent pointer-events-none" />
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="flex min-w-0 items-start gap-1.5 text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">
                        <Icon
                          icon="lucide:sparkles"
                          className="w-4 h-4 text-[#D8B76A]"
                        />
                        <span className="min-w-0 leading-snug">
                          3. AI Invitation Background Generator
                        </span>
                      </h3>
                      {!isPro && !isPlus && (
                        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          <Icon icon="lucide:lock" className="w-2.5 h-2.5" />{" "}
                          Plus / Pro Feature
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/65 leading-relaxed">
                      Generate stunning, one-of-a-kind AI wedding invitation
                      backgrounds tailored to your exact colors, style, and
                      cultural influence. The AI creates beautiful frame
                      graphics — VowLink overlays your text automatically.
                    </p>
                    <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {[
                          "Luxury Gold",
                          "Soft Floral",
                          "Burgundy Velvet",
                          "Traditional Nigerian",
                          "Navy & Gold",
                          "Emerald Green",
                        ].map((style) => (
                          <span
                            key={style}
                            className="px-2.5 py-1 text-[9px] rounded-full border border-white/15 text-white/70 bg-[#070A13]/70"
                          >
                            {style}
                          </span>
                        ))}
                        <span className="px-2.5 py-1 text-[9px] rounded-full border border-white/15 text-white/70 bg-[#070A13]/70">
                          + more
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/admin/templates#ai-backgrounds")
                        }
                        className={`w-full min-w-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer sm:w-auto sm:shrink-0 ${
                          !isPro && !isPlus
                            ? "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                            : "bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-[#070A13] shadow-[0_4px_16px_rgba(216,183,106,0.25)]"
                        }`}
                      >
                        <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
                        <span className="inline-flex min-w-0 items-center justify-center gap-1.5 text-center leading-tight">
                          {!isPro && !isPlus
                            ? "Upgrade to Generate"
                            : "Generate AI Background"}
                          {!isPro && !isPlus && (
                            <Icon icon="lucide:lock" className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Couple Portrait Image (Autoplays as card backdrop) */}
                  <div className="min-w-0 rounded-2xl border border-white/15 bg-[#111827] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-5 space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowCouplePortrait(!showCouplePortrait)}
                      className="flex w-full min-w-0 items-start justify-between gap-3 py-1 text-sm font-semibold uppercase tracking-widest text-[#D8B76A] transition hover:text-white cursor-pointer outline-none"
                    >
                      <span className="flex min-w-0 items-start gap-2 text-left leading-snug">
                        <Icon
                          icon="lucide:camera"
                          className="w-4 h-4 text-[#D8B76A]"
                        />{" "}
                        4. Couple Portrait Page Background
                        {isFree && (
                          <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded shrink-0">
                            Locked
                          </span>
                        )}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[#D8B76A]">
                        <Icon
                          icon={
                            showCouplePortrait
                              ? "lucide:chevron-up"
                              : "lucide:chevron-down"
                          }
                          className="h-3 w-3"
                        />
                        {showCouplePortrait ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showCouplePortrait && (
                      <div className="space-y-4 mt-4 animate-fade-in">
                        <p className="text-[10px] text-white/65 leading-relaxed">
                          Upload a romantic photo of the couple. It will serve
                          as the fullscreen background backdrop behind your
                          elegant invitation card, and will also be shown as the
                          preview image when sharing your invitation links on
                          WhatsApp, Slack, and other platforms.
                        </p>
                        <div>
                          <input
                            ref={couplePhotoInputRef}
                            type="file"
                            accept="image/*"
                            disabled={isFree}
                            onChange={handleCouplePhotoUpload}
                            className="block w-full max-w-full min-w-0 text-[11px] text-white/40 file:mr-2 file:max-w-full file:rounded-full file:border-0 file:bg-[#D8B76A]/10 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-[#D8B76A] hover:file:bg-[#D8B76A]/20 disabled:opacity-30"
                          />
                        </div>

                        {couplePhotoUrl && (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <img
                                src={couplePhotoUrl}
                                alt="Couple portrait"
                                className="h-16 w-16 rounded-xl object-cover border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  toast.dismiss();
                                  const ToastConfirm = ({ closeToast }) => (
                                    <div className="flex flex-col gap-2 p-1 text-white">
                                      <p className="font-semibold text-xs leading-relaxed">
                                        Are you sure you want to remove the
                                        couple portrait photo?
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
                                            setCouplePhotoUrl("");
                                            closeToast();
                                            toast.success(
                                              "Couple portrait photo removed.",
                                            );
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
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20"
                              >
                                Delete Photo
                              </button>
                            </div>

                            <div>
                              <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                                <span>Overlay darkening opacity</span>
                                <span className="font-mono text-[#D8B76A]">
                                  {Math.round(coupleOverlayOpacity * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="0.9"
                                step="0.05"
                                disabled={isFree}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A] disabled:opacity-40"
                                value={coupleOverlayOpacity}
                                onChange={(e) =>
                                  setCoupleOverlayOpacity(
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <p className="text-[8px] text-white/30 mt-1">
                                Darker overlay enhances the contrast and
                                readability of your card overlay text.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* WhatsApp/Social Share Preview Message */}
                  <div className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[#111827] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-5 space-y-4 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => setShowSocialShare(!showSocialShare)}
                      className="flex w-full min-w-0 items-start justify-between gap-3 py-1 text-sm font-semibold uppercase tracking-widest text-[#D8B76A] transition hover:text-white cursor-pointer outline-none"
                    >
                      <span className="flex min-w-0 items-start gap-2 text-left leading-snug">
                        <Icon
                          icon="lucide:link"
                          className="w-4 h-4 text-[#D8B76A]"
                        />{" "}
                        5. Social Share Preview Message
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[#D8B76A]">
                        <Icon
                          icon={
                            showSocialShare
                              ? "lucide:chevron-up"
                              : "lucide:chevron-down"
                          }
                          className="h-3 w-3"
                        />
                        {showSocialShare ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showSocialShare && (
                      <div className="space-y-4 mt-4 animate-fade-in">
                        <p className="text-[10px] text-white/65 leading-relaxed">
                          Customize the description text that guests see when
                          you share their invitation links on WhatsApp, Slack,
                          Facebook, etc. "Powered by VowLink" will automatically
                          be appended.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-[10px] uppercase tracking-widest text-white/50">
                            Custom Share Description
                          </label>
                          <textarea
                            rows="3"
                            placeholder="e.g. We are so excited to celebrate our special day with you! Tap to view your personal invitation and RSVP."
                            value={customShareMessage}
                            onChange={(e) =>
                              setCustomShareMessage(e.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 transition"
                          />
                          <p className="text-[8px] text-white/30 font-semibold">
                            Leave blank to use the default:{" "}
                            <em>
                              "You are specially invited to celebrate the
                              wedding of{" "}
                              {storedUser?.partner1Name || "Partner 1"} and{" "}
                              {storedUser?.partner2Name || "Partner 2"}. Tap the
                              link to view your invitation and RSVP."
                            </em>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Music & Photos */}
              {activeTab === "media" && <MusicSelector />}

              {/* TAB 4: Gift Registry & Cash Fund */}
              {activeTab === "registry" && (
                <div className="w-full">
                  <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-1.5">
                          <Icon
                            icon="lucide:gift"
                            className="w-4 h-4 text-[#D8B76A]"
                          />{" "}
                          Gift Registry
                        </h3>
                        <p className="text-white/40 text-xs mt-1">
                          Share bank details directly on your invitation and
                          RSVP confirmation pages.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/50">
                          Status
                        </label>
                        <button
                          type="button"
                          onClick={() => setRegistryEnabled(!registryEnabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            registryEnabled ? "bg-[#D8B76A]" : "bg-white/10"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-900 shadow-md ring-0 transition duration-200 ease-in-out ${
                              registryEnabled
                                ? "translate-x-5 bg-white"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {registryEnabled && (
                      <div className="space-y-6">
                        {/* Bank Details Card */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                            <Icon
                              icon="lucide:landmark"
                              className="w-3.5 h-3.5 text-white/60"
                            />{" "}
                            Bank Transfer Details
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                                Bank Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. GTBank / Chase"
                                value={registryBankName || ""}
                                onChange={(e) =>
                                  setRegistryBankName(e.target.value)
                                }
                                className={cls(false)}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                                Account Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. John & Jane Wedding"
                                value={registryAccountName || ""}
                                onChange={(e) =>
                                  setRegistryAccountName(e.target.value)
                                }
                                className={cls(false)}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">
                                Account Number
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 0123456789"
                                value={registryAccountNumber || ""}
                                onChange={(e) =>
                                  setRegistryAccountNumber(e.target.value)
                                }
                                className={cls(false)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Registry Notes */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                          <label className="block text-[10px] uppercase tracking-widest text-white/50">
                            Custom Gifting Message / Notes
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Your presence is gift enough, but if you wish to support our new beginning, here are our details. Thank you!"
                            value={registryNotes || ""}
                            onChange={(e) => setRegistryNotes(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30 resize-none transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Recent Cash Gifts History */}
                    {registryEnabled && (
                      <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220]/60 space-y-4 mt-6">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D8B76A] flex items-center gap-1.5">
                          <Icon
                            icon="lucide:gift"
                            className="w-3.5 h-3.5 text-[#D8B76A]"
                          />{" "}
                          Recent Cash Gifts
                        </h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                          Historical cash gifts recorded from the old online
                          gifting flow will appear here.
                        </p>

                        {gifts.length === 0 ? (
                          <div className="py-6 text-center border border-dashed border-white/10 rounded-xl text-white/30 text-xs">
                            No contributions received yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/20">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-white/10 text-white/40 text-[9px] uppercase tracking-wider">
                                  <th className="px-4 py-2">Guest</th>
                                  <th className="px-4 py-2">Amount</th>
                                  <th className="px-4 py-2">Message</th>
                                  <th className="px-4 py-2">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {gifts.map((g) => (
                                  <tr
                                    key={g._id}
                                    className="border-b border-white/5 last:border-0"
                                  >
                                    <td className="px-4 py-2.5 font-semibold text-white">
                                      {g.guestName}
                                    </td>
                                    <td className="px-4 py-2.5 text-[#34D399] font-bold">
                                      ₦{Number(g.amount).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2.5 text-white/60 italic max-w-xs truncate">
                                      {g.message || "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-white/30">
                                      {new Date(g.createdAt).toLocaleDateString(
                                        "en-GB",
                                        { day: "numeric", month: "short" },
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BOTTOM SAVE BAR */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full sm:w-auto rounded-full bg-red-600/10 border border-red-500/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-600/20 transition text-center"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon icon="lucide:rotate-ccw" className="h-3.5 w-3.5" />
                    Reset Defaults
                  </span>
                </button>
                <button
                  type={hasLockedTemplatePreview ? "button" : "submit"}
                  disabled={isSubmitting}
                  onClick={
                    hasLockedTemplatePreview
                      ? () => {
                          toast.info(
                            `${lockedTemplatePlanLabel} to save this template to your live invitation.`,
                            { toastId: "activate-classic-to-save" },
                          );
                          navigate("/admin/billing");
                        }
                      : undefined
                  }
                  id="save-settings-btn"
                  data-tour="settings-save"
                  className="w-full sm:w-auto rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-6 sm:px-10 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60 text-center"
                >
                  {isSubmitting
                    ? "Saving Config..."
                    : hasLockedTemplatePreview
                      ? `${lockedTemplatePlanLabel} to Save`
                      : "Save Customizations"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Security & Danger Zone */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 gap-6 pb-16 animate-fade-in xl:grid-cols-2 xl:items-start">
              {/* Change Password Card */}
              <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">
                  7. Change Password
                </h3>
                <p className="text-[10px] text-white/40">
                  Securely update your VowLink account password.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        <Icon
                          icon={
                            showCurrentPassword
                              ? "lucide:eye-off"
                              : "lucide:eye"
                          }
                          className="h-4 w-4"
                        />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        <Icon
                          icon={
                            showNewPassword ? "lucide:eye-off" : "lucide:eye"
                          }
                          className="h-4 w-4"
                        />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmNewPassword(!showConfirmNewPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        <Icon
                          icon={
                            showConfirmNewPassword
                              ? "lucide:eye-off"
                              : "lucide:eye"
                          }
                          className="h-4 w-4"
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={submittingPassword}
                    className="w-full rounded-xl bg-[#D8B76A] py-2.5 text-xs font-semibold text-[#070A13] transition hover:opacity-90 disabled:opacity-50 mt-2"
                  >
                    {submittingPassword
                      ? "Updating Password..."
                      : "Update Password"}
                  </button>
                </div>
              </div>

              {/* Event Check-in PIN Card */}
              <div className="p-3 sm:p-5 rounded-2xl border border-[#D8B76A]/20 bg-[#0D1220] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">
                      8. Event Check-in PIN
                    </h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                      Give this PIN to ushers so they can scan QR codes and
                      check guests in without your account login.
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${
                      checkInPinStatus.enabled
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-white/45"
                    }`}
                  >
                    <Icon
                      icon={
                        checkInPinStatus.enabled
                          ? "lucide:shield-check"
                          : "lucide:shield"
                      }
                      className="h-3.5 w-3.5"
                    />
                    {isFree
                      ? "Plus"
                      : loadingCheckInPin
                        ? "Checking"
                        : checkInPinStatus.enabled
                          ? "Active"
                          : "Off"}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-white/50">
                  {isFree
                    ? "Upgrade to Plus or Pro to enable guest entry QR codes and event PIN check-in."
                    : "Ushers can enter this PIN once on their phone after scanning a guest QR. Their browser gets temporary event access only. It cannot open settings, payments, guests, or your dashboard. Resetting or disabling this PIN is useful if it was shared with the wrong person; ushers may need to enter the new PIN again on their devices."}
                </div>

                {checkInPinStatus.enabled && checkInPinStatus.updatedAt && (
                  <p className="text-[10px] text-white/40">
                    Last updated{" "}
                    {new Date(checkInPinStatus.updatedAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">
                    {checkInPinStatus.enabled ? "New PIN" : "Create PIN"}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-white placeholder:text-center placeholder:text-xs placeholder:tracking-wider placeholder:text-white/25 outline-none focus:border-[#D8B76A]/60"
                    value={checkInPin}
                    onChange={(e) =>
                      setCheckInPin(
                        e.target.value.replace(/\D/g, "").slice(0, 8),
                      )
                    }
                    placeholder="4 to 8 digits"
                    disabled={isFree || savingCheckInPin || disablingCheckInPin}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveCheckInPin}
                    disabled={savingCheckInPin || disablingCheckInPin}
                    className="flex-1 rounded-xl bg-[#D8B76A] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#070A13] transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isFree
                      ? "Upgrade to Enable"
                      : savingCheckInPin
                        ? "Saving..."
                        : checkInPinStatus.enabled
                          ? "Reset PIN"
                          : "Enable PIN"}
                  </button>
                  {checkInPinStatus.enabled && (
                    <button
                      type="button"
                      onClick={handleDisableCheckInPin}
                      disabled={savingCheckInPin || disablingCheckInPin}
                      className="flex-1 rounded-xl border border-red-500/30 bg-red-600/10 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-600/20 disabled:opacity-50"
                    >
                      {disablingCheckInPin ? "Disabling..." : "Disable PIN"}
                    </button>
                  )}
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="p-3 sm:p-5 rounded-2xl border border-red-500/20 bg-[#1A0A0F] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-red-400">
                      9. Danger Zone
                    </h3>
                    <p className="text-[10px] text-red-200/50 mt-1 max-w-xs leading-relaxed">
                      Permanently purge your VowLink account, invitations, and
                      guest RSVPs. This action is irreversible.
                    </p>
                  </div>

                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-xs font-semibold text-red-200 hover:bg-red-600/30 transition shrink-0 self-start sm:self-center"
                    >
                      Delete Account
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="space-y-3 pt-3 border-t border-red-500/10 animate-fade-in">
                    <div>
                      <label className="mb-1 block text-[9px] uppercase tracking-widest text-red-200/60 font-semibold">
                        Enter Password to Confirm Deletion
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-red-500/30 bg-white/5 px-4 py-2 text-xs text-white outline-none focus:border-red-500/60"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={submittingDelete}
                        className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {submittingDelete ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Card Preview & Quick Upload Design (Pro Only) */}
        {activeTab !== "security" && <InvitationCardPreview />}
      </div>

      {/* Reset Confirmation Modal */}
      {activeTab !== "security" && hasUnsavedSettingsChanges && (
        <div className="sticky-action-bar fixed inset-x-0 bottom-0 z-60 border-t border-[#D8B76A]/25 bg-[#070A13]/95 px-4 py-3 text-white shadow-[0_-18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <Icon
                icon="lucide:circle-alert"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#D8B76A]"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#D8B76A]">
                  Unsaved changes
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                  Pending: {changedSettingsLabel}. Save to update the live
                  invitation.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
              {hasTemplatePreviewChanges && (
                <button
                  type="button"
                  onClick={restoreSavedTemplate}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:border-[#D8B76A]/40 hover:text-[#D8B76A] sm:px-4"
                >
                  Restore template
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/55 transition hover:bg-white/10 hover:text-white sm:px-4"
              >
                Discard
              </button>
              <button
                type={hasLockedTemplatePreview ? "button" : "submit"}
                form="settings-customization-form"
                disabled={isSubmitting}
                onClick={
                  hasLockedTemplatePreview
                    ? () => {
                        toast.info(
                          `${lockedTemplatePlanLabel} to save this template to your live invitation.`,
                          { toastId: "activate-classic-to-save-sticky" },
                        );
                        navigate("/admin/billing");
                      }
                    : undefined
                }
                className="col-span-2 rounded-xl bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.25)] disabled:opacity-60 sm:col-span-1"
              >
                {isSubmitting
                  ? "Saving..."
                  : hasLockedTemplatePreview
                    ? `${lockedTemplatePlanLabel} to save`
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1220] p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Icon
                icon="lucide:alert-triangle"
                className="text-2xl text-amber-500 shrink-0"
              />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Reset Customizations?
                </h3>
                <p className="text-white/60 text-xs">
                  Are you sure you want to reset all design customizations to
                  default? This will clear your custom background, couple photo,
                  colors, fonts, and music selections.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-[#D8B76A]/80 bg-[#D8B76A]/5 p-3 rounded-lg border border-[#D8B76A]/10 flex items-center gap-1.5">
              <Icon
                icon="lucide:lightbulb"
                className="w-3.5 h-3.5 text-[#D8B76A]"
              />
              <span>
                Note: Make sure to click "Save Customizations" after resetting
                to apply these changes to your live cards.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35 transition"
              >
                Reset Customizations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper and Editor Modal */}
      {cropperOpen && (
        <ImageEditorModal
          isOpen={cropperOpen}
          imageSrc={cropperImageSrc}
          title={cropperTitle}
          defaultAspect={cropperDefaultAspect}
          onClose={() => {
            setCropperOpen(false);
            setCropperQueue([]); // Clear crop queue on cancel
          }}
          onConfirm={async (croppedDataUrl) => {
            const callback = cropperCallback;
            setCropperOpen(false);
            setCropperQueue((prev) => prev.slice(1));
            try {
              if (callback) {
                await callback(croppedDataUrl);
              }
            } catch (err) {
              console.error("Cropper confirm callback failed:", err);
            }
          }}
        />
      )}
    </div>
  );
};

const AdminSettingsPage = () => {
  return (
    <SettingsProvider>
      <AdminSettingsPageContent />
    </SettingsProvider>
  );
};

export default AdminSettingsPage;
