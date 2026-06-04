import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { settingsSchema } from "../../utils/schemas";
import ColorPicker, { WEDDING_COLORS } from "../../components/ColorPicker";
import CustomSelect from "../../components/CustomSelect";
import { Link, useNavigate } from "react-router-dom";

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
const inputErr = "border-red-400/50";
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`;

const toInputDate = (dateStr) =>
  dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

const THEMES = [
  { value: "floral", label: "Classic Floral (Free / All plans)" },
  { value: "minimalist", label: "Modern Minimalist (Plus / Pro)" },
  { value: "navy", label: "Royal Navy & Gold (Plus / Pro)" },
  { value: "stardust", label: "Animated Stardust (Pro Only)" },
  { value: "forest", label: "Animated Whimsical Forest (Pro Only)" },
  { value: "custom", label: "Upload Custom Card Image (Pro Only)" },
];

const FONTS = [
  { value: "classic", label: "Serif & Script Hybrid" },
  { value: "serif", label: "Formal Elegant Serif" },
  { value: "script", label: "Romantic Handwritten Script" },
  { value: "modern", label: "Clean Modern Sans-Serif" },
];

const PREMADE_TEMPLATES = [
  {
    tier: "free",
    name: "Classic Ivory & Gold",
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
    tier: "plus",
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
];

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

const resolveWeddingColors = (colors, defaultColorsList) => {
  const colorMap = {};
  defaultColorsList.forEach(c => {
    colorMap[c.name.toLowerCase()] = c.hex;
  });

  const hexList = (colors || []).map(name => colorMap[name.toLowerCase()]).filter(Boolean);

  const primary = hexList[0] || "#1A2E4A"; // Default Navy
  const secondary = hexList[1] || hexList[0] || "#C9A84C"; // Default Gold
  const tertiary = hexList[2] || secondary;

  const lightColors = ["ivory", "white", "cream", "nude", "blush pink", "peach", "mint green", "champagne gold"];
  const selectedBgColorName = (colors || []).find(name => lightColors.includes(name.toLowerCase()));
  const selectedBgHex = selectedBgColorName ? colorMap[selectedBgColorName.toLowerCase()] : null;

  return { primary, secondary, tertiary, selectedBgHex };
};

const renderThemeOrnaments = (theme, pri, sec, ter, isFreeUser) => {
  const flowerColor = isFreeUser ? "#8C715A" : pri;
  const leafColor = isFreeUser ? "#A3B899" : sec;
  const accentColor = isFreeUser ? "#D4C5B9" : ter;

  if (theme === "floral") {
    return (
      <>
        {/* Top-Left Floral Cluster */}
        <svg className="absolute top-0 left-0 w-20 h-20 pointer-events-none select-none opacity-80 z-0" viewBox="0 0 100 100" fill="none">
          <path d="M0,0 Q30,10 50,40 Q40,60 30,70" stroke={leafColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0,0 Q10,30 30,60 Q50,70 60,80" stroke={leafColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

          <path d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12" fill={leafColor} opacity="0.8" />
          <path d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25" fill={leafColor} opacity="0.8" />

          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <circle cx="15" cy="15" r="4" fill={accentColor} />
          <circle cx="38" cy="20" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="20" cy="38" r="6" fill={flowerColor} opacity="0.95" />
        </svg>

        {/* Bottom-Right Floral Cluster */}
        <svg className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none select-none opacity-80 rotate-180 z-0" viewBox="0 0 100 100" fill="none">
          <path d="M0,0 Q30,10 50,40 Q40,60 30,70" stroke={leafColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0,0 Q10,30 30,60 Q50,70 60,80" stroke={leafColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

          <path d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12" fill={leafColor} opacity="0.8" />
          <path d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25" fill={leafColor} opacity="0.8" />

          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <circle cx="15" cy="15" r="4" fill={accentColor} />
        </svg>
      </>
    );
  }

  if (theme === "minimalist") {
    return (
      <svg className="absolute top-4 left-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none select-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="96" fill="none" stroke={pri} strokeWidth="0.75" opacity="0.4" />
        <rect x="4" y="4" width="92" height="92" fill="none" stroke={sec} strokeWidth="0.5" opacity="0.3" />

        <path d="M10,4 L4,4 L4,10" fill="none" stroke={pri} strokeWidth="1" />
        <path d="M90,4 L96,4 L96,10" fill="none" stroke={pri} strokeWidth="1" />
        <path d="M10,96 L4,96 L4,90" fill="none" stroke={pri} strokeWidth="1" />
        <path d="M90,96 L96,96 L96,90" fill="none" stroke={pri} strokeWidth="1" />
      </svg>
    );
  }

  if (theme === "navy") {
    return (
      <svg className="absolute top-3 left-3 w-[calc(100%-24px)] h-[calc(100%-24px)] pointer-events-none select-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="146" rx="4" fill="none" stroke={sec} strokeWidth="1" opacity="0.7" />
        <rect x="4" y="4" width="92" height="142" rx="2" fill="none" stroke={pri} strokeWidth="0.5" opacity="0.3" />

        <path d="M5,15 C5,10 10,5 15,5 M5,10 C5,7 7,5 10,5" stroke={sec} strokeWidth="0.75" />
        <path d="M95,15 C95,10 90,5 85,5 M95,10 C95,7 93,5 90,5" stroke={sec} strokeWidth="0.75" />
        <path d="M5,135 C5,140 10,145 15,145 M5,140 C5,143 7,145 10,145" stroke={sec} strokeWidth="0.75" />
        <path d="M95,135 C95,140 90,145 85,145 M95,140 C95,143 93,145 90,145" stroke={sec} strokeWidth="0.75" />

        <path d="M42,8 L44,11 L47,9 L50,13 L53,9 L56,11 L58,8 L56,15 L44,15 Z" fill={sec} opacity="0.8" />
        <rect x="44" y="16" width="12" height="1" fill={sec} opacity="0.8" />
      </svg>
    );
  }

  if (theme === "stardust") {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-28 h-28 rounded-full blur-[40px] opacity-25" style={{ backgroundColor: pri }} />
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 rounded-full blur-[40px] opacity-20" style={{ backgroundColor: sec }} />
        <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute top-1/3 right-8 w-1 h-1 rounded-full bg-white opacity-60 animate-ping" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/3 left-10 w-2 h-2 rounded-full bg-white opacity-40 animate-pulse" style={{ animationDuration: "4s" }} />
      </div>
    );
  }

  if (theme === "forest") {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-12 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,0 Q10,8 20,2 Q30,12 40,4" stroke={sec} strokeWidth="1.2" fill="none" />
        </svg>
        <div className="absolute top-4 left-1/4 animate-bounce text-[10px]" style={{ animationDuration: "6s", color: pri }}>🍃</div>
        <div className="absolute top-8 left-2/3 animate-bounce text-[10px]" style={{ animationDuration: "8s", color: sec, animationDelay: "2s" }}>🍂</div>
      </div>
    );
  }

  return null;
};

const AdminSettingsPage = () => {
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

  // Local device audio state (stored in localStorage, not sent to server)
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
  const [customTextSize, setCustomTextSize] = useState(storedUser.customTextSize || 1.0);
  const [couplePhotoUrl, setCouplePhotoUrl] = useState(storedUser.couplePhotoUrl || "");
  const [coupleOverlayOpacity, setCoupleOverlayOpacity] = useState(storedUser.coupleOverlayOpacity ?? 0.45);
  const [musicUrl, setMusicUrl] = useState(storedUser.musicUrl || "");
  const [galleryPhotos, setGalleryPhotos] = useState(storedUser.galleryPhotos || []);

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
  const [activeTab, setActiveTab] = useState("details");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  const {
    register,
    handleSubmit,
    watch,
    control,
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
      receptionLocation: storedUser.receptionLocation || "",
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
  const receptionLocation = watch("receptionLocation");
  const dressCode = watch("dressCode");
  const weddingTime = watch("weddingTime");

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
    try {
      // Don't send base64 audio data URLs to server (too large for DB / server limits)
      // Local audio is stored only in localStorage and plays on the couple's device
      const musicUrlToSave = musicUrl && musicUrl.startsWith('data:') ? '' : musicUrl;
      const res = await api.put("/auth/me", {
        ...data,
        weddingColors,
        cardTheme,
        customCardBg,
        pageBgTemplate,
        couplePhotoUrl,
        coupleOverlayOpacity,
        customTextColor,
        customFontFamily,
        customVerticalOffset: Number(customVerticalOffset),
        customTextSize: Number(customTextSize),
        musicUrl: musicUrlToSave,
        galleryPhotos,
      });

      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Settings saved successfully! ✓ Updates applied to invitation cards.");
      window.location.reload(); // Refresh token details globally
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed. Please try again.");
    }
  };

  // Gallery file handler
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
      reader.onloadend = () => {
        setGalleryPhotos((prev) => [...prev, reader.result]);
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

  // Custom background card handler
  const handleCustomCardBgUpload = (e) => {
    if (!isPro) {
      toast.warning("Custom design backgrounds are a Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomCardBg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Couple photo upload handler (for card background overlay)
  const handleCouplePhotoUpload = (e) => {
    if (isFree) {
      toast.warning("Couple photo overlay is a Plus and Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCouplePhotoUrl(reader.result);
        toast.success("Couple photo uploaded! 💑 It will appear as the card background.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Local device audio upload handler
  const handleLocalAudioUpload = (e) => {
    if (isFree) {
      toast.warning("Background music is a Plus and Pro feature! Upgrade to unlock.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 30 * 1024 * 1024; // 30MB limit
    if (file.size > maxSize) {
      toast.error("Audio file is too large. Please use a file under 30MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      try {
        localStorage.setItem(`vowlink_local_audio_url_${storedUser._id}`, dataUrl);
        localStorage.setItem(`vowlink_local_audio_name_${storedUser._id}`, file.name);
      } catch (storageErr) {
        // LocalStorage quota exceeded — file is too large for storage
        toast.error("Audio file is too large to store locally. Try a smaller file (under 10MB).");
        return;
      }
      setLocalAudioUrl(dataUrl);
      setLocalAudioName(file.name);
      setMusicUrl(dataUrl); // Also set as musicUrl so it goes into the preview player
      toast.success(`🎵 "${file.name}" uploaded! Music will autoplay on your device when guests open the invitation.`);
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

  // Simulated AI Vibe matcher
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
      background: selectedBgHex || "#FDFDFD",
      border: `6px double ${secHex}33`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#2E3A59",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "navy") {
    let bg = "radial-gradient(circle, #0F1F38 0%, #060D18 100%)";
    if (weddingColors.includes("Burgundy")) {
      bg = "radial-gradient(circle, #4A0E17 0%, #1A0508 100%)";
    } else if (weddingColors.includes("Emerald Green")) {
      bg = "radial-gradient(circle, #0C2818 0%, #05120A 100%)";
    } else if (weddingColors.includes("Midnight Black")) {
      bg = "radial-gradient(circle, #1F1F1F 0%, #080808 100%)";
    } else if (priHex && priHex !== "#1A2E4A") {
      bg = `radial-gradient(circle, ${priHex}44 0%, #050912 100%)`;
    }
    cardStyles = {
      background: bg,
      border: `2px solid ${secHex}`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : secHex,
      fontFamily: activeFont,
    };
  } else if (cardTheme === "stardust") {
    let bg = "radial-gradient(circle, #120A24 0%, #06080F 100%)";
    if (priHex && priHex !== "#1A2E4A") {
      bg = `radial-gradient(circle, ${priHex}33 0%, #03050A 100%)`;
    }
    cardStyles = {
      background: bg,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#FFFFFF",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "forest") {
    let bg = "radial-gradient(circle, #0F2C1B 0%, #07150C 100%)";
    if (weddingColors.includes("Burgundy")) {
      bg = "radial-gradient(circle, #380E14 0%, #140305 100%)";
    } else if (weddingColors.includes("Midnight Black")) {
      bg = "radial-gradient(circle, #1A1A1A 0%, #080808 100%)";
    } else if (priHex && priHex !== "#1A2E4A") {
      bg = `radial-gradient(circle, ${priHex}22 0%, #040A06 100%)`;
    }
    cardStyles = {
      background: bg,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : secHex,
      fontFamily: activeFont,
    };
  } else if (cardTheme === "custom" && customCardBg) {
    cardStyles = {
      background: `url('${customCardBg}') center/cover no-repeat`,
      color: customTextColor,
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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto text-white">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Account</p>
        <h2 className="font-serif text-3xl sm:text-4xl">Settings & Customization</h2>
        <p className="text-white/40 text-sm mt-1">
          Customize your wedding invitation card appearance, photo gallery, dress code, and venue preferences.
        </p>
      </div>

      {/* Glassmorphic Tabs Selector */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 border-b border-white/10 pb-4">
        {[
          { id: "details", label: "💍 Details", fullLabel: "💍 Wedding Details" },
          { id: "design", label: "🎨 Design", fullLabel: "🎨 Design & Theme" },
          { id: "media", label: "🎵 Music", fullLabel: "🎵 Media & Music" },
          { id: "security", label: "🔒 Security", fullLabel: "🔒 Security & Danger Zone" }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "security") {
                setShowDeleteConfirm(false);
              }
            }}
            className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id
              ? "bg-[#D8B76A] text-[#070A13] shadow-[0_8px_20px_rgba(216,183,106,0.25)]"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
          >
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Hidden file input for quick custom card design triggers from the preview */}
      <input
        ref={customBgInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomCardBgUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Tabs/Forms container */}
        <div className={`col-span-12 ${activeTab === "security" ? "lg:col-span-12" : "lg:col-span-7"} space-y-6`}>

          {/* Main Form for Details, Design, and Media settings */}
          {(activeTab === "details" || activeTab === "design" || activeTab === "media") && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">

              {/* TAB 1: Wedding Details */}
              {activeTab === "details" && (
                <div className="w-full">
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">1. Wedding Metadata</h3>

                    {/* Partner names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Partner 1 *</label>
                        <input id="settings-p1" {...register("partner1Name")} className={cls(errors.partner1Name)} />
                        {errors.partner1Name && <p className="mt-1 text-xs text-red-400">{errors.partner1Name.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Partner 2 *</label>
                        <input id="settings-p2" {...register("partner2Name")} className={cls(errors.partner2Name)} />
                        {errors.partner2Name && <p className="mt-1 text-xs text-red-400">{errors.partner2Name.message}</p>}
                      </div>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Wedding Date</label>
                        <input
                          id="settings-wedding-date"
                          type="date"
                          {...register("weddingDate")}
                          className={`${cls(false)} scheme-dark text-xs`}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Wedding Time</label>
                        <div className="relative">
                          <input
                            id="settings-wedding-time"
                            type="time"
                            {...register("weddingTime")}
                            className={`${cls(false)} scheme-dark text-xs pr-28`}
                          />
                          {weddingTime && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#D8B76A] bg-[#D8B76A]/10 px-2 py-0.5 rounded-md pointer-events-none select-none">
                              {new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[9px] text-white/30">Invitations display time in 12-hr format (e.g. 2:00 PM)</p>
                      </div>
                    </div>

                    {/* RSVP Deadline */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">RSVP Deadline</label>
                      <input
                        id="settings-rsvp-deadline"
                        type="date"
                        {...register("rsvpDeadline")}
                        max={weddingDate || undefined}
                        className={`${cls(false)} scheme-dark text-xs`}
                      />
                    </div>

                    {/* Venue Location */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Ceremony Venue</label>
                      <input id="settings-venue" placeholder="e.g. The Grand Ballroom, Lekki" {...register("venue")} className={cls(false)} />
                    </div>

                    {/* Reception Location */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Reception Venue</label>
                      <input
                        id="settings-reception-location"
                        placeholder="e.g. Reception Gardens, Lekki"
                        {...register("receptionLocation")}
                        className={cls(false)}
                      />
                    </div>

                    {/* Dress Code */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Dress Code</label>
                      <input id="settings-dress-code" placeholder="e.g. Black Tie / Emerald Gold" {...register("dressCode")} className={cls(false)} />
                    </div>

                    {/* Guest Policies */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#D8B76A]">Plus One Limit</label>
                        <Controller
                          name="plusOnePolicy"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              name={field.name}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              options={[
                                { value: "invitation_only", label: "Strictly by invitation" },
                                { value: "plus_one_allowed", label: "Plus one allowed" },
                              ]}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-widest text-white/50">Kids Allowed</label>
                        <input
                          type="checkbox"
                          {...register("kidsAllowed")}
                          className="h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Design & Theme */}
              {activeTab === "design" && (
                <div className="space-y-6">
                  {/* Invitation Theme Options */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">2. Invitation Theme Layout</h3>
                      {isFree && (
                        <Link to="/admin/billing" className="text-[9px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                          Upgrade
                        </Link>
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
                            toast.info("Upgrade to Plus or Pro plan to unlock custom themes!");
                            navigate("/admin/billing");
                            return;
                          }
                          if (isPlus && val === "custom") {
                            toast.info("Upgrade to Pro plan to unlock custom background design uploads!");
                            navigate("/admin/billing");
                            return;
                          }
                          setCardTheme(val);
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
                                  if (isFree) {
                                    toast.info("Upgrade to Plus or Pro plan to unlock premium themes!");
                                    navigate("/admin/billing");
                                  } else {
                                    toast.info("Upgrade to Pro plan to unlock custom card design uploads!");
                                    navigate("/admin/billing");
                                  }
                                  return;
                                }
                                setCardTheme(theme.value);
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
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs outline-none focus:border-[#D8B76A]/60 text-white"
                            value={customTextColor}
                            onChange={(e) => setCustomTextColor(e.target.value)}
                            placeholder="#1A2E4A"
                          />
                        </div>
                      </div>
                    )}

                    {/* Guidelines and Pre-made Templates (All Tiers) */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      {/* Warning box */}
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
                            onClick={() => setPageBgTemplate("")}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                              !pageBgTemplate
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
                              const isSelected = pageBgTemplate === t.url;
                              return (
                                <button
                                  key={t.name}
                                  type="button"
                                  onClick={() => {
                                    setPageBgTemplate(t.url);
                                  }}
                                  className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                                    }`}
                                  style={{ background: `url(${t.preview}) center/cover no-repeat` }}
                                >
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
                              const isSelected = pageBgTemplate === t.url;
                              return (
                                <button
                                  key={t.name}
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      toast.info("Upgrade to Plus or Pro plan to unlock Plus templates!");
                                      navigate("/admin/billing");
                                      return;
                                    }
                                    setPageBgTemplate(t.url);
                                  }}
                                  className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                                    }`}
                                  style={{ background: `url(${t.preview}) center/cover no-repeat` }}
                                >
                                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />

                                  {isLocked && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                                      <span className="text-sm">🔒</span>
                                      <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                                        Plus / Pro
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
                              const isSelected = pageBgTemplate === t.url;
                              return (
                                <button
                                  key={t.name}
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      toast.info("Upgrade to Pro plan to unlock Pro templates!");
                                      navigate("/admin/billing");
                                      return;
                                    }
                                    setPageBgTemplate(t.url);
                                  }}
                                  className={`relative h-24 rounded-xl overflow-hidden border transition group hover:scale-102 flex flex-col justify-end p-3 ${isSelected ? "border-[#D8B76A] ring-2 ring-[#D8B76A]" : "border-white/10"
                                    }`}
                                  style={{ background: `url(${t.preview}) center/cover no-repeat` }}
                                >
                                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />

                                  {isLocked && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                                      <span className="text-sm">🔒</span>
                                      <span className="text-[8px] uppercase tracking-wider text-white/80 mt-1 font-bold">
                                        Pro Only
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
                              onClick={() => setCardTheme("custom")}
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
                                    setCustomCardBg("");
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
                      <div className="space-y-3">
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

                      {/* Reset button */}
                      {(customVerticalOffset !== 0 || customTextSize !== 1.0) && (
                        <button
                          type="button"
                          onClick={() => { setCustomVerticalOffset(0); setCustomTextSize(1.0); }}
                          className="text-[9px] uppercase text-white/30 hover:text-white/60 tracking-wider transition"
                        >
                          ↺ Reset to defaults
                        </button>
                      )}
                    </div>
                    )}
                  </div>

                  {/* ─── Couple Photo Overlay ─── */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">💑 Couple Photo Page Background</h3>
                        <p className="text-[9px] text-white/40 mt-0.5">Your photo becomes the background of the entire invitation page, behind the card</p>
                      </div>
                      {isFree && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">Plus+</span>
                      )}
                    </div>

                    {isFree ? (
                      <div className="rounded-xl bg-white/3 border border-white/8 p-4 text-center">
                        <p className="text-[10px] text-white/40">Upgrade to Plus or Pro to add a background photo behind the card.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Upload */}
                        <div>
                          <label className="block text-[9px] text-white/50 uppercase mb-1.5">Upload Couple Photo (.jpg / .png)</label>
                          <input
                            ref={couplePhotoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCouplePhotoUpload}
                            className="w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#D8B76A]/15 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/25"
                          />
                        </div>

                        {couplePhotoUrl && (
                          <>
                            {/* Thumbnail + Remove */}
                            <div className="flex items-center gap-3">
                              <div className="h-20 w-14 rounded-xl overflow-hidden border border-white/10 relative group shrink-0">
                                <img src={couplePhotoUrl} alt="Couple" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => { setCouplePhotoUrl(""); if (couplePhotoInputRef.current) couplePhotoInputRef.current.value = ""; }}
                                  className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex-1 space-y-2">
                                <p className="text-[9px] text-emerald-400 font-semibold">✓ Photo applied to page background</p>
                                {/* Overlay opacity slider */}
                                <div>
                                  <div className="flex justify-between text-[9px] text-white/40 mb-1">
                                    <span>Dark overlay intensity</span>
                                    <span className="font-mono text-[#D8B76A]">{Math.round(coupleOverlayOpacity * 100)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="0.85"
                                    step="0.05"
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A]"
                                    value={coupleOverlayOpacity}
                                    onChange={(e) => setCoupleOverlayOpacity(Number(e.target.value))}
                                  />
                                  <p className="text-[8px] text-white/25 mt-0.5">Lower = more photo visible. Higher = text easier to read.</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Wedding Vibe Matcher */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">3. AI Wedding Vibe Matcher (Pro)</h3>
                    <div className="space-y-3">
                      <label className="block text-[10px] text-white/50 uppercase">Wedding Vibe Style</label>
                      <div className="flex gap-2">
                        <select
                          disabled={!isPro}
                          className="flex-1 rounded-xl border border-white/10 bg-[#0D1220] px-3 py-2.5 text-xs text-white outline-none disabled:opacity-50"
                          value={aiVibe}
                          onChange={(e) => setAiVibe(e.target.value)}
                        >
                          <option value="Royal Velvet">Royal Velvet (Burgundy & Gold)</option>
                          <option value="Vintage Rose">Vintage Rose (Blush & Sage)</option>
                          <option value="Starry Midnight">Starry Midnight (Cosmic & Silver)</option>
                          <option value="Emerald Garden">Emerald Garden (Forest & Champagne)</option>
                        </select>

                        <button
                          type="button"
                          disabled={!isPro || aiGenerating}
                          onClick={handleAiVibeGenerate}
                          className="rounded-xl bg-[#D8B76A] px-4 text-xs font-semibold text-[#070A13] hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          {aiGenerating ? (
                            <span className="h-3 w-3 rounded-full border border-[#070A13]/25 border-t-[#070A13] animate-spin" />
                          ) : (
                            "🪄 Auto Match"
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-white/30 leading-relaxed">
                        AI analyzes your wedding vibe style and instantly configures premium typography, card backgrounds, and text styling coordinates.
                      </p>
                    </div>
                  </div>

                  {/* Colors of the Day */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">4. Colors of the Day</h3>
                    <ColorPicker value={weddingColors} onChange={setWeddingColors} />
                  </div>
                </div>
              )}

              {/* TAB 3: Music & Photos */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  {/* Photo Gallery */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">5. Love Story Photo Gallery</h3>
                      {isFree && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 uppercase mb-2">
                        Upload Gallery Photos ({galleryPhotos.length} / {isPro ? 6 : isPlus ? 3 : 0})
                      </label>
                      <input
                        ref={galleryInputRef}
                        disabled={isFree}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="w-full text-xs text-white/40 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D8B76A]/10 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                      <p className="text-[9px] text-white/30 mt-1">
                        {isPro ? "Upload up to 6 high-res photos." : isPlus ? "Upload up to 3 photos." : "Gallery is locked. Upgrade to Plus/Pro."}
                      </p>

                      {/* Photos grid */}
                      {galleryPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {galleryPhotos.map((photo, index) => (
                            <div key={index} className="h-16 rounded-xl border border-white/10 overflow-hidden relative group">
                              <img src={photo} alt={`Couple ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Music */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">6. Background Music (Plus / Pro)</h3>
                      {isFree && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Curated MP3 Soundtracks */}
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-2">Curated Background Soundtracks (Autoplays)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { name: "A Thousand Years (Piano)", url: "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3", emoji: "🎹" },
                            { name: "Perfect (Acoustic Guitar)", url: "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3", emoji: "🎸" },
                            { name: "Can't Help Falling in Love", url: "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3", emoji: "🎻" },
                            { name: "All of Me (Piano Solo)", url: "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3", emoji: "🎵" },
                            { name: "Thinking Out Loud", url: "https://archive.org/download/AlsPlaylistMixedGenre/Ed%20Sheeran%20-%20Thinking%20Out%20Loud.mp3", emoji: "💑" },
                            { name: "Wedding March (Classical)", url: "https://archive.org/download/wedding-march/Wedding%20March.mp3", emoji: "⛪" }
                          ].map((p) => {
                            const isSelected = musicUrl === p.url;
                            return (
                              <button
                                key={p.name}
                                type="button"
                                disabled={isFree}
                                onClick={() => setMusicUrl(p.url)}
                                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${isSelected
                                  ? "border-[#D8B76A] bg-[#D8B76A]/10 text-white"
                                  : "border-white/10 bg-white/3 text-white/70 hover:border-white/20"
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                <span className="text-lg">{p.emoji}</span>
                                <div className="truncate">
                                  <p className="text-xs font-semibold truncate">{p.name}</p>
                                  <p className="text-[8px] text-white/40 truncate font-mono">wedding cover</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Curated Spotify Playlists */}
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-2">Curated Spotify Playlists (Floating Widget)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { name: "Acoustic Love", url: "https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51xh", emoji: "🎸" },
                            { name: "Modern Wedding Hits", url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGC2m8jH", emoji: "🎶" },
                            { name: "Classical Wedding", url: "https://open.spotify.com/playlist/37i9dQZF1DX2419n24N13N", emoji: "🎻" },
                            { name: "First Dance Classics", url: "https://open.spotify.com/playlist/37i9dQZF1DX7gPfB5X117A", emoji: "💃" }
                          ].map((p) => {
                            const isSelected = musicUrl === p.url;
                            return (
                              <button
                                key={p.name}
                                type="button"
                                disabled={isFree}
                                onClick={() => setMusicUrl(p.url)}
                                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${isSelected
                                  ? "border-[#D8B76A] bg-[#D8B76A]/10 text-white"
                                  : "border-white/10 bg-white/3 text-white/70 hover:border-white/20"
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                <span className="text-lg">{p.emoji}</span>
                                <div className="truncate">
                                  <p className="text-xs font-semibold truncate">{p.name}</p>
                                  <p className="text-[8px] text-white/40 truncate">Spotify Playlist</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Upload from Device */}
                      <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] text-[#D8B76A] uppercase font-bold tracking-wider">📱 Upload from Your Device</label>
                          {localAudioUrl && (
                            <button type="button" onClick={clearLocalAudio} className="text-[9px] uppercase tracking-wider text-red-400 hover:underline">Remove</button>
                          )}
                        </div>
                        <input
                          ref={localAudioInputRef}
                          type="file"
                          accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
                          disabled={isFree}
                          onChange={handleLocalAudioUpload}
                          className="w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#D8B76A]/15 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/25 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        {localAudioName && (
                          <p className="text-[9px] text-[#D8B76A]/80 font-semibold truncate">🎵 {localAudioName}</p>
                        )}
                        <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-2">
                          <p className="text-[8px] text-amber-200/70 leading-relaxed">
                            ⚠️ <strong>Device-local only:</strong> Your uploaded song plays only on this device/browser. For guests to hear music, use a Spotify playlist link or hosted MP3 URL above.
                          </p>
                        </div>
                      </div>

                      {/* Custom Input */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] text-white/50 uppercase">Or Enter Custom Soundtrack Link</label>
                          {musicUrl && !localAudioUrl && (
                            <button
                              type="button"
                              onClick={() => setMusicUrl("")}
                              className="text-[9px] uppercase tracking-wider text-red-400 hover:underline"
                            >
                              Clear Music
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          disabled={isFree}
                          placeholder="e.g. Spotify playlist link or direct MP3 URL"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 disabled:opacity-40"
                          value={localAudioUrl ? "" : musicUrl}
                          onChange={(e) => { setMusicUrl(e.target.value); }}
                          readOnly={!!localAudioUrl}
                        />
                        <p className="text-[8px] text-white/30 mt-1">
                          Supports Spotify URLs or direct audio file URLs ending in .mp3, .m4a.
                        </p>
                      </div>

                      {/* Real-time Music Preview */}
                      {musicUrl && (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                          <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1.5">Preview Player</p>
                          {getSpotifyEmbedUrl(musicUrl) ? (
                            <>
                              <iframe
                                src={getSpotifyEmbedUrl(musicUrl)}
                                width="100%"
                                height="80"
                                frameBorder="0"
                                allowFullScreen=""
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="rounded-xl border border-white/10"
                                referrerPolicy="no-referrer-when-downgrade"
                              ></iframe>
                              <p className="text-[8px] text-white/40 leading-relaxed italic bg-white/3 p-2 rounded-lg border border-white/5">
                                💡 Tip: If Spotify preview says "Page not found", it is a known Spotify security conflict with your logged-in browser session. Try viewing in an Incognito window or logging out of Spotify.
                              </p>
                            </>
                          ) : (
                            <audio
                              src={musicUrl}
                              controls
                              className="w-full h-8 rounded-lg bg-white/5 text-xs focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM SAVE BAR */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="save-settings-btn"
                  className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60"
                >
                  {isSubmitting ? "Saving Config..." : "Save Customizations"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Security & Danger Zone (Self-Contained Forms) */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in">
              {/* Change Password Card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">7. Change Password</h3>
                <p className="text-[10px] text-white/40">Securely update your VowLink account password.</p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">Current Password</label>
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
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        {showCurrentPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">New Password</label>
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
                        {showNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold font-semibold">Confirm New Password</label>
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
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        {showConfirmNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={submittingPassword}
                    className="w-full rounded-xl bg-[#D8B76A] py-2.5 text-xs font-semibold text-[#070A13] transition hover:opacity-90 disabled:opacity-50 mt-2"
                  >
                    {submittingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="p-5 rounded-2xl border border-red-500/20 bg-[#1A0A0F] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-red-400">8. Danger Zone</h3>
                    <p className="text-[10px] text-red-200/50 mt-1 max-w-xs leading-relaxed">
                      Permanently purge your VowLink account, invitations, and guest RSVPs. This action is irreversible.
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
        {activeTab !== "security" && (
          <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-8 space-y-4 animate-fade-in">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D8B76A] font-bold">Live Invitation Card Preview</p>

            <div 
              className="w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 p-4 sm:p-6 relative flex items-center justify-center min-h-[580px]"
              style={{ background: "#070A13" }}
            >
              {/* Page Background (Couple Photo or Pre-made Template) */}
              {couplePhotoUrl || pageBgTemplate ? (
                <>
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 animate-fade-in"
                    style={{ backgroundImage: `url(${couplePhotoUrl || pageBgTemplate})` }}
                  />
                  <div 
                    className="absolute inset-0 z-0 transition-all duration-300"
                    style={{ backgroundColor: `rgba(0, 0, 0, ${couplePhotoUrl ? coupleOverlayOpacity : 0.3})` }}
                  />
                </>
              ) : (
                /* Gold shimmer / dark gradient fallback background */
                <div 
                  className="absolute inset-0 z-0 opacity-40" 
                  style={{ background: "radial-gradient(circle at 50% 30%, #1A2E4A 0%, #070A13 80%)" }}
                />
              )}

              {/* The Invitation Card */}
              <div
                className="relative z-10 w-full overflow-hidden rounded-xl shadow-2xl border border-white/5"
                style={cardStyles}
              >
                {renderThemeOrnaments(cardTheme, priHex, secHex, terHex, isFreeUser)}

                <div
                  className="relative z-10 px-5 sm:px-10 pt-12 pb-14 flex flex-col items-center justify-center text-center w-full min-h-[500px] transition-all"
                  style={{
                    fontSize: `${customTextSize}em`,
                    paddingTop: `calc(4.5rem + ${customVerticalOffset}px)`,
                    paddingBottom: `calc(5rem - ${customVerticalOffset}px)`,
                  }}
                >
                  <h2 className="mt-2" style={{ fontFamily: activeFont, color: primaryTextColor, fontSize: "1.25em" }}>
                    Wedding Invitation
                  </h2>

                  <div className="flex items-center gap-1.5 my-3 text-[0.6em]" style={{ color: primaryTextColor }}>
                    <div className="h-px w-8 bg-current opacity-40" />
                    <span>❧</span>
                    <div className="h-px w-8 bg-current opacity-40" />
                  </div>

                  <p className="italic mb-1" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                    Marriage between
                  </p>

                  <h1 className="font-bold my-1 leading-tight" style={{ fontFamily: activeFont, color: primaryTextColor, fontSize: "1.8em" }}>
                    {p1 || "Partner 1"} <span style={{ color: accentColor }}>and</span> {p2 || "Partner 2"}
                  </h1>

                  <div className="flex items-center gap-1.5 my-3 text-[0.5em]" style={{ color: primaryTextColor }}>
                    <div className="h-px w-6 bg-current opacity-30" />
                    <span>✦</span>
                    <div className="h-px w-6 bg-current opacity-30" />
                  </div>

                  <p className="mb-3" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                    Dear Guest Name,
                  </p>

                  <p className="mb-4 max-w-[240px] leading-relaxed opacity-90" style={{ color: primaryTextColor, fontSize: "0.7em" }}>
                    We request the honor of your presence as we celebrate our love and write a new chapter of our lives together.
                  </p>

                  {formattedDate && (
                    <p className="mb-1" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                      Date: {formattedDate}
                    </p>
                  )}

                  {weddingTime && (
                    <p className="mb-1" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                      Time: {formattedTime}
                    </p>
                  )}

                  {venue && (
                    <p className="mb-1 max-w-[200px] truncate" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                      Location: {venue}
                    </p>
                  )}

                  {receptionLocation && (
                    <p className="mb-3 max-w-[200px] truncate" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                      Reception: {receptionLocation}
                    </p>
                  )}

                  {weddingColors.length > 0 && (
                    <div className="mt-3">
                      <p className="uppercase tracking-widest mb-1.5" style={{ color: accentColor, fontSize: "0.55em" }}>
                        Colour of the Day
                      </p>
                      <div className="flex gap-2 justify-center">
                        {weddingColors.map((name, i) => {
                          const hex = WEDDING_COLORS.find(c => c.name === name)?.hex || "#999";
                          return (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                              <div className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: hex }} />
                              <span className="opacity-75" style={{ color: primaryTextColor, fontSize: "0.5em" }}>{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Upload Own Card Action (Pro Only) */}
            {isPro && (
              <div className="flex flex-col gap-2 items-center justify-center p-4 rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/5">
                <p className="text-[10px] uppercase font-bold text-[#D8B76A] tracking-wider text-center">Pro Premium Quick Action</p>
                <button
                  type="button"
                  onClick={() => {
                    setCardTheme("custom");
                    if (customBgInputRef.current) {
                      customBgInputRef.current.click();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-xs font-bold uppercase tracking-wider text-[#070A13] transition flex items-center justify-center gap-2"
                >
                  <span>📷</span> {customCardBg ? "Change Your Card Background" : "Add Your Own Card Design"}
                </button>
                <p className="text-[8px] text-white/40 text-center">Select custom card theme to preview your own card design.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
