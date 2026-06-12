import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { settingsSchema } from "../utils/schemas";
import { WEDDING_COLORS } from "../components/ColorPicker";

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

const toInputDate = (dateStr) =>
  dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

const resolveWeddingColors = (colors, defaultColorsList) => {
  const colorMap = {};
  defaultColorsList.forEach(c => {
    colorMap[c.name.toLowerCase()] = c.hex;
  });

  const hexList = (colors || []).map(name => colorMap[name.toLowerCase()]).filter(Boolean);

  const primary = hexList[0] || "#1A2E4A"; // Default Navy
  
  const isDarkColor = (hex) => {
    const darkHexes = ["#1a2e4a", "#1c1c1c", "#800020", "#2d6a4f", "#008080", "#2b4d9c"];
    return darkHexes.includes(hex.toLowerCase());
  };

  const secondary = hexList[1] || (hexList[0] && !isDarkColor(hexList[0]) ? hexList[0] : "#C9A84C");
  const tertiary = hexList[2] || secondary;

  const lightColors = ["ivory", "white", "cream", "nude", "blush pink", "peach", "mint green", "champagne gold"];
  const selectedBgColorName = (colors || []).find(name => lightColors.includes(name.toLowerCase()));
  const selectedBgHex = selectedBgColorName ? colorMap[selectedBgColorName.toLowerCase()] : null;

  return { primary, secondary, tertiary, selectedBgHex };
};

const getSpotifyEmbedUrl = (url) => {
  if (!url) return "";
  const match = url.match(/spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9\-_]+)/);
  if (match) {
    const type = match[1];
    const id = match[2];
    return `https://open.spotify.com/embed/${type}/${id}?autoplay=1`;
  }
  return "";
};

export const SettingsProvider = ({ children }) => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const tier = storedUser.tier || "free";
  const isFree = tier === "free";
  const isPlus = tier === "plus";
  const isPro = tier === "pro";

  const [weddingColors, setWeddingColors] = useState(storedUser.weddingColors || []);

  // Refs for file inputs
  const galleryInputRef = useRef(null);
  const customBgInputRef = useRef(null);
  const couplePhotoInputRef = useRef(null);
  const localAudioInputRef = useRef(null);

  // Local device audio state
  const [localAudioUrl, setLocalAudioUrl] = useState(() => {
    try { return localStorage.getItem(`vowlink_local_audio_url_${storedUser._id}`) || ""; } catch { return ""; }
  });
  const [localAudioName, setLocalAudioName] = useState(() => {
    try { return localStorage.getItem(`vowlink_local_audio_name_${storedUser._id}`) || ""; } catch { return ""; }
  });

  // Premium state fields
  const [cardTheme, setCardTheme] = useState(storedUser.cardTheme || "floral");
  const [pageBgTemplate, setPageBgTemplate] = useState(storedUser.pageBgTemplate || "");
  const [customCardBg, setCustomCardBg] = useState(storedUser.customCardBg || "");
  const [customTextColor, setCustomTextColor] = useState(storedUser.customTextColor || "#1A2E4A");
  const [customFontFamily, setCustomFontFamily] = useState(storedUser.customFontFamily || "classic");
  const [customVerticalOffset, setCustomVerticalOffset] = useState(storedUser.customVerticalOffset || 0);
  const [customHorizontalOffset, setCustomHorizontalOffset] = useState(storedUser.customHorizontalOffset || 0);
  const [smartLayoutEnabled, setSmartLayoutEnabled] = useState(typeof storedUser.smartLayoutEnabled === "boolean" ? storedUser.smartLayoutEnabled : true);
  const [customTextSize, setCustomTextSize] = useState(storedUser.customTextSize || 1.0);
  const [customTextBoldness, setCustomTextBoldness] = useState(storedUser.customTextBoldness || "normal");
  const [customTextAlign, setCustomTextAlign] = useState(storedUser.customTextAlign || "center");
  const [couplePhotoUrl, setCouplePhotoUrl] = useState(storedUser.couplePhotoUrl || "");
  const [coupleOverlayOpacity, setCoupleOverlayOpacity] = useState(storedUser.coupleOverlayOpacity ?? 0.45);
  const [musicUrl, setMusicUrl] = useState(storedUser.musicUrl || "");
  const [galleryPhotos, setGalleryPhotos] = useState(storedUser.galleryPhotos || []);

  // Registry & Honeymoon Fund states
  const [registryEnabled, setRegistryEnabled] = useState(storedUser.registryEnabled || false);
  const [registryBankName, setRegistryBankName] = useState(storedUser.registryBankName || "");
  const [registryAccountName, setRegistryAccountName] = useState(storedUser.registryAccountName || "");
  const [registryAccountNumber, setRegistryAccountNumber] = useState(storedUser.registryAccountNumber || "");
  const [registryNotes, setRegistryNotes] = useState(storedUser.registryNotes || "");
  const [honeymoonFundTarget, setHoneymoonFundTarget] = useState(storedUser.honeymoonFundTarget || 0);
  const [musicUrlToSaveDummy, setMusicUrlToSaveDummy] = useState(""); // Dummy to assist grouping
  const [honeymoonFundCurrent, setHoneymoonFundCurrent] = useState(storedUser.honeymoonFundCurrent || 0);

  const [timeline, setTimeline] = useState(storedUser.timeline || []);
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        if (storedUser._id && storedUser.role !== "admin") {
          const res = await api.get("/auth/registry/gifts");
          setGifts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch registry gifts:", err);
      }
    };
    fetchGifts();
  }, [storedUser._id, storedUser.role]);

  // AI Matcher state
  const [aiVibe, setAiVibe] = useState("Royal Velvet");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Tabs & password visibility states
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem("vowlink_settings_active_tab") || "details";
    } catch {
      return "details";
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("vowlink_settings_active_tab", activeTab);
    } catch (e) {
      console.error("Failed to save activeTab to sessionStorage:", e);
    }
  }, [activeTab]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      partner1Name: storedUser.partner1Name || "",
      partner2Name: storedUser.partner2Name || "",
      weddingDate: toInputDate(storedUser.weddingDate),
      weddingTime: storedUser.weddingTime || "",
      rsvpDeadline: toInputDate(storedUser.rsvpDeadline),
      venue: storedUser.venue || "",
      venueName: storedUser.venueName || "",
      receptionLocation: storedUser.receptionLocation || "",
      receptionName: storedUser.receptionName || "",
      dressCode: storedUser.dressCode || "",
      plusOnePolicy: storedUser.plusOnePolicy || "invitation_only",
      kidsAllowed: typeof storedUser.kidsAllowed === "boolean" ? storedUser.kidsAllowed : true,
    },
  });

  const p1 = watch("partner1Name");
  const p2 = watch("partner2Name");
  const weddingDate = watch("weddingDate");
  const rsvpDeadline = watch("rsvpDeadline");
  const venue = watch("venue");
  const venueName = watch("venueName");
  const receptionLocation = watch("receptionLocation");
  const receptionName = watch("receptionName");
  const dressCode = watch("dressCode");
  const weddingTime = watch("weddingTime");

  // Fetch full profile on mount to hydrate media fields not included in login response
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const freshUser = res.data;
        if (freshUser.galleryPhotos?.length) setGalleryPhotos(freshUser.galleryPhotos);
        if (freshUser.customCardBg) setCustomCardBg(freshUser.customCardBg);
        if (freshUser.couplePhotoUrl) setCouplePhotoUrl(freshUser.couplePhotoUrl);
        if (freshUser.pageBgTemplate) setPageBgTemplate(freshUser.pageBgTemplate);
        if (freshUser.musicUrl) setMusicUrl(freshUser.musicUrl);
        if (freshUser.cardTheme) setCardTheme(freshUser.cardTheme);
        if (freshUser.customTextColor) setCustomTextColor(freshUser.customTextColor);
        if (freshUser.customFontFamily) setCustomFontFamily(freshUser.customFontFamily);
        if (typeof freshUser.coupleOverlayOpacity === "number") setCoupleOverlayOpacity(freshUser.coupleOverlayOpacity);
        if (typeof freshUser.customVerticalOffset === "number") setCustomVerticalOffset(freshUser.customVerticalOffset);
        if (typeof freshUser.customHorizontalOffset === "number") setCustomHorizontalOffset(freshUser.customHorizontalOffset);
        if (typeof freshUser.smartLayoutEnabled === "boolean") setSmartLayoutEnabled(freshUser.smartLayoutEnabled);
        if (typeof freshUser.customTextSize === "number") setCustomTextSize(freshUser.customTextSize);
        if (freshUser.customTextBoldness) setCustomTextBoldness(freshUser.customTextBoldness);
        if (freshUser.customTextAlign) setCustomTextAlign(freshUser.customTextAlign);
        if (typeof freshUser.registryEnabled === "boolean") setRegistryEnabled(freshUser.registryEnabled);
        if (freshUser.registryBankName) setRegistryBankName(freshUser.registryBankName);
        if (freshUser.registryAccountName) setRegistryAccountName(freshUser.registryAccountName);
        if (freshUser.registryAccountNumber) setRegistryAccountNumber(freshUser.registryAccountNumber);
        if (freshUser.registryNotes) setRegistryNotes(freshUser.registryNotes);
        if (typeof freshUser.honeymoonFundTarget === "number") setHoneymoonFundTarget(freshUser.honeymoonFundTarget);
        if (typeof freshUser.honeymoonFundCurrent === "number") setHoneymoonFundCurrent(freshUser.honeymoonFundCurrent);
        if (freshUser.timeline) setTimeline(freshUser.timeline);
        if (Array.isArray(freshUser.weddingColors) && freshUser.weddingColors.length) setWeddingColors(freshUser.weddingColors);
        
        reset({
          partner1Name: freshUser.partner1Name || "",
          partner2Name: freshUser.partner2Name || "",
          weddingDate: toInputDate(freshUser.weddingDate),
          weddingTime: freshUser.weddingTime || "",
          rsvpDeadline: toInputDate(freshUser.rsvpDeadline),
          venue: freshUser.venue || "",
          venueName: freshUser.venueName || "",
          receptionLocation: freshUser.receptionLocation || "",
          receptionName: freshUser.receptionName || "",
          dressCode: freshUser.dressCode || "",
          plusOnePolicy: freshUser.plusOnePolicy || "invitation_only",
          kidsAllowed: typeof freshUser.kidsAllowed === "boolean" ? freshUser.kidsAllowed : true,
        });
      } catch {
        // Silently fail
      }
    };
    fetchFullProfile();
  }, [reset]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.warning("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    try {
      setSubmittingPassword(true);
      await api.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully! ✓");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.warning("Please enter your password to confirm.");
      return;
    }

    try {
      setSubmittingDelete(true);
      await api.delete("/auth/delete-account", { data: { confirmPassword: deletePassword } });
      toast.success("Your account has been deleted. Goodbye!");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed. Check password.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const onSubmit = async (data) => {
    if (registryEnabled) {
      const targetVal = Number(honeymoonFundTarget) || 0;
      const currentVal = Number(honeymoonFundCurrent) || 0;
      if (targetVal > 0 && currentVal > targetVal) {
        toast.error("Current contribution cannot exceed the target goal amount.");
        return;
      }
    }

    try {
      const musicUrlToSave = musicUrl && musicUrl.startsWith('data:') ? '' : musicUrl;
      const res = await api.put("/auth/me", {
        ...data,
        weddingColors,
        cardTheme,
        customCardBg,
        pageBgTemplate: "",
        couplePhotoUrl,
        coupleOverlayOpacity,
        customTextColor,
        customFontFamily,
        customVerticalOffset: Number(customVerticalOffset),
        customHorizontalOffset: Number(customHorizontalOffset),
        smartLayoutEnabled: Boolean(smartLayoutEnabled),
        customTextSize: Number(customTextSize),
        customTextBoldness,
        customTextAlign,
        musicUrl: musicUrlToSave,
        galleryPhotos,
        registryEnabled: Boolean(registryEnabled),
        registryBankName,
        registryAccountName,
        registryAccountNumber,
        registryNotes,
        honeymoonFundTarget: Number(honeymoonFundTarget),
        honeymoonFundCurrent: Number(honeymoonFundCurrent),
        timeline,
      });

      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Settings saved successfully! ✓ Updates applied to invitation cards.");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed. Please try again.");
    }
  };

  const onInvalid = (errors) => {
    console.error("Form validation errors:", errors);
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const msg = errors[firstErrorField]?.message || "Validation failed.";
      toast.error(`Validation Error: ${msg} ❌`);
    } else {
      toast.error("Please check the form for validation errors.");
    }
  };

  const uploadToCloudinary = async (base64Str) => {
    const toastId = toast.loading("Uploading file to Cloudinary...");
    try {
      const res = await api.post("/auth/upload", { file: base64Str });
      toast.update(toastId, {
        render: "Upload complete! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
      return res.data.url;
    } catch (err) {
      toast.update(toastId, {
        render: "Upload failed: " + (err.response?.data?.message || err.message),
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      throw err;
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = isPlus ? 3 : isPro ? 6 : 0;

    if (isFree) {
      toast.warning("Photo galleries are a Plus and Pro plan feature! Upgrade to unlock.");
      return;
    }

    if (galleryPhotos.length + files.length > maxPhotos) {
      toast.warning(`Your ${tier.toUpperCase()} plan limit is up to ${maxPhotos} photos.`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const url = await uploadToCloudinary(reader.result);
          setGalleryPhotos((prev) => [...prev, url]);
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleCustomCardBgUpload = (e) => {
    if (!isPro) {
      toast.warning("Custom design backgrounds are a Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const url = await uploadToCloudinary(reader.result);
          setCustomCardBg(url);
          setCustomTextColor("#FFFFFF");
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCouplePhotoUpload = (e) => {
    if (isFree) {
      toast.warning("Couple photo overlay is a Plus and Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const url = await uploadToCloudinary(reader.result);
          setCouplePhotoUrl(url);
          setPageBgTemplate("");
          toast.success("Couple photo uploaded! 💑 It will appear as the page background.");
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocalAudioUpload = (e) => {
    if (isFree) {
      toast.warning("Background music is a Plus and Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Audio file is too large. Please use a file under 30MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const url = await uploadToCloudinary(reader.result);
        localStorage.setItem(`vowlink_local_audio_url_${storedUser._id}`, url);
        localStorage.setItem(`vowlink_local_audio_name_${storedUser._id}`, file.name);
        setLocalAudioUrl(url);
        setLocalAudioName(file.name);
        setMusicUrl(url);
        toast.success(`🎵 "${file.name}" uploaded and hosted successfully! Guests can now play this soundtrack.`);
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const clearLocalAudio = () => {
    try {
      localStorage.removeItem(`vowlink_local_audio_url_${storedUser._id}`);
      localStorage.removeItem(`vowlink_local_audio_name_${storedUser._id}`);
    } catch { }
    setLocalAudioUrl("");
    setLocalAudioName("");
    if (musicUrl === localAudioUrl) setMusicUrl("");
    if (localAudioInputRef.current) localAudioInputRef.current.value = "";
    toast.info("Local audio cleared.");
  };

  const handleResetAll = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    setCardTheme("floral");
    setPageBgTemplate("");
    setCustomCardBg("");
    setCustomTextColor("#1A2E4A");
    setCustomFontFamily("classic");
    setCustomVerticalOffset(0);
    setCustomHorizontalOffset(0);
    setSmartLayoutEnabled(true);
    setCustomTextSize(1.0);
    setCustomTextBoldness("normal");
    setCustomTextAlign("center");
    setCouplePhotoUrl("");
    setCoupleOverlayOpacity(0.45);
    setMusicUrl("");
    setGalleryPhotos([]);
    setWeddingColors([]);

    setRegistryEnabled(false);
    setRegistryBankName("");
    setRegistryAccountName("");
    setRegistryAccountNumber("");
    setRegistryNotes("");
    setHoneymoonFundTarget(0);
    setHoneymoonFundCurrent(0);
    setTimeline([]);

    if (customBgInputRef.current) customBgInputRef.current.value = "";
    if (couplePhotoInputRef.current) couplePhotoInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (localAudioInputRef.current) localAudioInputRef.current.value = "";

    setShowResetConfirm(false);
    toast.success("Settings reset to defaults! Click 'Save Customizations' to persist.");
  };

  const handleAiVibeGenerate = () => {
    if (!isPro) {
      toast.info("The AI Theme Matcher is a Pro feature! Upgrade to unlock.");
      return;
    }

    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);

      if (aiVibe === "Royal Velvet") {
        setCardTheme("navy");
        setWeddingColors(["Burgundy", "Gold", "Ivory"]);
        setCustomTextColor("#D4AF37");
        setCustomFontFamily("serif");
        toast.success("🪄 AI Matcher applied 'Royal Velvet': Deep Burgundy & Gold layout with elegant typography.");
      } else if (aiVibe === "Vintage Rose") {
        setCardTheme("floral");
        setWeddingColors(["Blush Pink", "Sage Green", "Cream"]);
        setCustomTextColor("#8A4F58");
        setCustomFontFamily("script");
        toast.success("🪄 AI Matcher applied 'Vintage Rose': Soft blush elements & romantic script.");
      } else if (aiVibe === "Starry Midnight") {
        setCardTheme("stardust");
        setWeddingColors(["Midnight Black", "Silver", "White"]);
        setCustomTextColor("#FFFFFF");
        setCustomFontFamily("modern");
        toast.success("🪄 AI Matcher applied 'Starry Midnight': Dark cosmic backdrop with metallic silver accents.");
      } else if (aiVibe === "Emerald Garden") {
        setCardTheme("forest");
        setWeddingColors(["Emerald Green", "Gold", "White"]);
        setCustomTextColor("#D4AF37");
        setCustomFontFamily("serif");
        toast.success("🪄 AI Matcher applied 'Emerald Garden': Deep green forest backdrop with gold accents.");
      }
    }, 1500);
  };

  const getSmartTextColor = (theme, cardBg) => {
    if (["navy", "stardust", "forest"].includes(theme)) return "#F5EBD6";
    if (["floral", "minimalist"].includes(theme)) return "#1A2E4A";
    if (theme === "custom" && cardBg) {
      const darkTemplates = [
        "/templates/template_plus_1.png",
        "/templates/template_plus_2.png",
        "/templates/template_plus_3.png",
        "/templates/template_pro_1.png",
        "/templates/template_pro_2.png",
        "/templates/template_pro_3.png",
        "/templates/template_pro_6.png",
        "/templates/template_pro_7.png",
      ];
      const lightTemplates = [
        "/templates/template_free_1.png",
        "/templates/template_free_2.png",
        "/templates/template_free_3.png",
        "/templates/template_pro_4.png",
        "/templates/template_pro_5.png",
      ];
      if (darkTemplates.includes(cardBg)) return "#F5EBD6";
      if (lightTemplates.includes(cardBg)) return "#1A2E4A";
      return "#FFFFFF";
    }
    return "#1A2E4A";
  };

  const checkSmartAlignment = (templateUrl, overrideEnabled = smartLayoutEnabled) => {
    if (!overrideEnabled) return;

    const leftAlignTemplates = [
      "/templates/template_plus_2.png",
      "/templates/template_plus_3.png",
    ];

    if (leftAlignTemplates.includes(templateUrl)) {
      setCustomTextAlign("left");
      setCustomHorizontalOffset(25);
      setCustomVerticalOffset(15);
      setCustomTextSize(0.9);
      toast.info("🪄 Smart layout optimized: Left alignment, 25px margin & 0.9x text size applied to prevent design overlap!", {
        toastId: "smart-align-toast"
      });
    } else if (templateUrl === "/templates/template_plus_1.png") {
      // Emerald Eucalyptus Frame - shift vertically to avoid leaf graphics
      setCustomTextAlign("center");
      setCustomHorizontalOffset(0);
      setCustomVerticalOffset(25);
      setCustomTextSize(0.95);
      toast.info("🪄 Smart layout optimized: Centered alignment & +25px vertical offset to avoid top frame overlay!", {
        toastId: "smart-align-toast"
      });
    } else if (
      templateUrl === "/templates/template_pro_1.png" ||
      templateUrl === "/templates/template_pro_2.png" ||
      templateUrl === "/templates/template_pro_3.png" ||
      templateUrl === "/templates/template_pro_4.png" ||
      templateUrl === "/templates/template_pro_5.png" ||
      templateUrl === "/templates/template_pro_6.png" ||
      templateUrl === "/templates/template_pro_7.png"
    ) {
      // Pro templates (marble background, filigree, border frames) - shrink slightly to sit inside borders and give generous text space
      setCustomTextAlign("center");
      setCustomHorizontalOffset(0);
      setCustomVerticalOffset(15);
      setCustomTextSize(0.9);
      toast.info("🪄 Smart layout optimized: Centered alignment & 0.9x text size to fit beautifully inside borders!", {
        toastId: "smart-align-toast"
      });
    } else {
      // Default / standard templates
      setCustomTextAlign("center");
      setCustomHorizontalOffset(0);
      setCustomVerticalOffset(0);
      setCustomTextSize(1.0);
    }
  };

  // Automatically trigger smart layout optimizations when the user enables the checkbox
  useEffect(() => {
    if (smartLayoutEnabled && customCardBg && cardTheme === "custom") {
      checkSmartAlignment(customCardBg, true);
    }
  }, [smartLayoutEnabled, customCardBg, cardTheme]);

  const formattedTime = weddingTime
    ? new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const fontMap = {
    classic: "'Cormorant Garamond', serif",
    serif: "'Cormorant Garamond', serif",
    script: "'Dancing Script', cursive",
    modern: "'Outfit', sans-serif",
  };
  const activeFont = fontMap[customFontFamily] || fontMap.classic;

  const { primary: priHex, secondary: secHex, tertiary: terHex, selectedBgHex } = resolveWeddingColors(weddingColors, WEDDING_COLORS);
  const isFreeUser = storedUser.tier === "free";

  let cardStyles = {
    background: "radial-gradient(circle, #FFFDF9 60%, #FAF6F0 100%)",
    color: "#1A2E4A",
    fontFamily: activeFont,
  };

  if (cardTheme === "floral") {
    cardStyles = {
      background: selectedBgHex || "radial-gradient(circle, #FFFDF9 60%, #FAF6F0 100%)",
      color: customTextColor || "#1A2E4A",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "minimalist") {
    cardStyles = {
      background: "radial-gradient(circle, #FFFFFF 60%, #F5F7FA 100%)",
      border: `6px double ${secHex}33`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#2E3A59",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "navy") {
    cardStyles = {
      background: "radial-gradient(circle, #0F1F38 0%, #060D18 100%)",
      border: `2px solid ${secHex}`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : secHex,
      fontFamily: activeFont,
    };
  } else if (cardTheme === "stardust") {
    cardStyles = {
      background: "radial-gradient(circle, #0D0B1C 0%, #05040B 100%)",
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#FFFFFF",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "forest") {
    cardStyles = {
      background: "radial-gradient(circle, #071C11 0%, #030C07 100%)",
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : secHex,
      fontFamily: activeFont,
    };
  } else if (cardTheme === "custom" && customCardBg) {
    const darkTemplates = [
      "/templates/template_plus_1.png",
      "/templates/template_plus_2.png",
      "/templates/template_plus_3.png",
      "/templates/template_pro_1.png",
      "/templates/template_pro_2.png",
      "/templates/template_pro_3.png",
      "/templates/template_pro_6.png",
      "/templates/template_pro_7.png",
    ];
    const isDarkBg = darkTemplates.includes(customCardBg);
    const fallbackColor = isDarkBg ? "#F5EBD6" : "#1A2E4A";
    const bgUrlWithVersion = customCardBg.includes('/templates/') ? `${customCardBg}?v=3` : customCardBg;
    const bgSize = customCardBg.includes('/templates/') ? "100% 100%" : "cover";
    cardStyles = {
      background: `url('${bgUrlWithVersion}') center/${bgSize} no-repeat`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : fallbackColor,
      fontFamily: activeFont,
    };
  }

  const primaryTextColor = cardStyles.color;
  const accentColor = cardTheme === "navy" || cardTheme === "forest" || cardTheme === "stardust" ? secHex : (isFreeUser ? "#B8963A" : priHex);

  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SettingsContext.Provider
      value={{
        storedUser,
        tier,
        isFree,
        isPlus,
        isPro,
        isFreeUser,

        galleryInputRef,
        customBgInputRef,
        couplePhotoInputRef,
        localAudioInputRef,

        weddingColors, setWeddingColors,
        cardTheme, setCardTheme,
        pageBgTemplate, setPageBgTemplate,
        customCardBg, setCustomCardBg,
        customTextColor, setCustomTextColor,
        customFontFamily, setCustomFontFamily,
        customVerticalOffset, setCustomVerticalOffset,
        customHorizontalOffset, setCustomHorizontalOffset,
        smartLayoutEnabled, setSmartLayoutEnabled,
        customTextSize, setCustomTextSize,
        customTextBoldness, setCustomTextBoldness,
        customTextAlign, setCustomTextAlign,
        couplePhotoUrl, setCouplePhotoUrl,
        coupleOverlayOpacity, setCoupleOverlayOpacity,
        musicUrl, setMusicUrl,
        galleryPhotos, setGalleryPhotos,
        localAudioUrl, setLocalAudioUrl,
        localAudioName, setLocalAudioName,
        registryEnabled, setRegistryEnabled,
        registryBankName, setRegistryBankName,
        registryAccountName, setRegistryAccountName,
        registryAccountNumber, setRegistryAccountNumber,
        registryNotes, setRegistryNotes,
        honeymoonFundTarget, setHoneymoonFundTarget,
        honeymoonFundCurrent, setHoneymoonFundCurrent,
        timeline, setTimeline,
        gifts, setGifts,

        aiVibe, setAiVibe,
        aiGenerating, setAiGenerating,
        handleAiVibeGenerate,

        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmNewPassword, setConfirmNewPassword,
        submittingPassword, setSubmittingPassword,
        handleChangePassword,

        showDeleteConfirm, setShowDeleteConfirm,
        deletePassword, setDeletePassword,
        submittingDelete, setSubmittingDelete,
        handleDeleteAccount,

        activeTab, setActiveTab,
        showResetConfirm, setShowResetConfirm,
        showCurrentPassword, setShowCurrentPassword,
        showNewPassword, setShowNewPassword,
        showConfirmNewPassword, setShowConfirmNewPassword,

        register,
        handleSubmit,
        watch,
        control,
        errors,
        isSubmitting,
        onSubmit,
        onInvalid,

        handlePhotoUpload,
        removePhoto,
        handleCustomCardBgUpload,
        handleCouplePhotoUpload,
        handleLocalAudioUpload,
        clearLocalAudio,
        handleResetAll,
        handleResetConfirm,
        getSmartTextColor,
        checkSmartAlignment,
        uploadToCloudinary,
        getSpotifyEmbedUrl,

        p1, p2, weddingDate, rsvpDeadline, venue, venueName, receptionLocation, receptionName, dressCode, weddingTime,
        formattedTime,
        activeFont,
        priHex, secHex, terHex, selectedBgHex,
        cardStyles,
        primaryTextColor,
        accentColor,
        formattedDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
