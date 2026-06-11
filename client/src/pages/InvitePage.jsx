import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { toPng } from "html-to-image";
import api from "../utils/api";
import { rsvpSchema } from "../utils/schemas";
import { WEDDING_COLORS } from "../components/ColorPicker";

const getSpotifyEmbedUrl = (url) => {
  if (!url) return "";
  const match = url.match(/spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9\-_]+)/);
  if (match) {
    const type = match[1];
    const id = match[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&autoplay=1`;
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

const renderThemeOrnaments = (theme, pri, sec, ter, isFreeUser) => {
  const flowerColor = isFreeUser ? "#8C715A" : pri;
  const leafColor = isFreeUser ? "#A3B899" : sec;
  const accentColor = isFreeUser ? "#D4C5B9" : ter;

  if (theme === "floral") {
    return (
      <>
        {/* Top-Left Floral Cluster */}
        <svg className="absolute top-0 left-0 w-28 h-28 pointer-events-none select-none opacity-85 z-0" viewBox="0 0 100 100" fill="none">
          <path d="M0,0 Q30,10 50,40 Q40,60 30,70" stroke={leafColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0,0 Q10,30 30,60 Q50,70 60,80" stroke={leafColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          
          {/* Leaf Shapes */}
          <path d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12" fill={leafColor} opacity="0.8" />
          <path d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25" fill={leafColor} opacity="0.8" />
          <path d="M40,30 C35,38 45,45 48,38 C43,30 40,30 40,30" fill={leafColor} opacity="0.7" />
          <path d="M30,48 C25,55 35,62 38,55 C33,48 30,48 30,48" fill={leafColor} opacity="0.7" />

          {/* Flower blooms */}
          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <path d="M9,15 C9,9 21,9 21,15 C21,21 9,21 9,15 Z" fill={flowerColor} opacity="0.9" />
          <circle cx="15" cy="15" r="4" fill={accentColor} />

          <circle cx="38" cy="20" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="20" cy="38" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="38" cy="20" r="2.5" fill={accentColor} />
          <circle cx="20" cy="38" r="2.5" fill={accentColor} />
        </svg>

        {/* Bottom-Right Floral Cluster */}
        <svg className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none select-none opacity-85 rotate-180 z-0" viewBox="0 0 100 100" fill="none">
          <path d="M0,0 Q30,10 50,40 Q40,60 30,70" stroke={leafColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0,0 Q10,30 30,60 Q50,70 60,80" stroke={leafColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          
          {/* Leaf Shapes */}
          <path d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12" fill={leafColor} opacity="0.8" />
          <path d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25" fill={leafColor} opacity="0.8" />
          <path d="M40,30 C35,38 45,45 48,38 C43,30 40,30 40,30" fill={leafColor} opacity="0.7" />
          <path d="M30,48 C25,55 35,62 38,55 C33,48 30,48 30,48" fill={leafColor} opacity="0.7" />

          {/* Flower blooms */}
          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <path d="M9,15 C9,9 21,9 21,15 C21,21 9,21 9,15 Z" fill={flowerColor} opacity="0.9" />
          <circle cx="15" cy="15" r="4" fill={accentColor} />

          <circle cx="38" cy="20" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="20" cy="38" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="38" cy="20" r="2.5" fill={accentColor} />
          <circle cx="20" cy="38" r="2.5" fill={accentColor} />
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
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full blur-[60px] opacity-25" style={{ backgroundColor: pri }} />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-[60px] opacity-20" style={{ backgroundColor: sec }} />
        
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white opacity-80 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute top-1/3 right-12 w-1.5 h-1.5 rounded-full bg-white opacity-60 animate-ping" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/3 left-16 w-2.5 h-2.5 rounded-full bg-white opacity-40 animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-20 right-20 w-2 h-2 rounded-full bg-white opacity-90 animate-pulse" style={{ animationDuration: "2.5s" }} />
      </div>
    );
  }

  if (theme === "forest") {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-20 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,0 Q10,8 20,2 Q30,12 40,4 Q50,15 60,3 Q70,12 80,2 Q90,10 100,0" stroke={sec} strokeWidth="1.2" fill="none" />
          <circle cx="10" cy="5" r="2" fill={pri} />
          <circle cx="28" cy="7" r="2.5" fill={sec} />
          <circle cx="48" cy="9" r="2.2" fill={pri} />
          <circle cx="68" cy="8" r="2" fill={sec} />
          <circle cx="88" cy="6" r="1.8" fill={pri} />
        </svg>
        
        <div className="absolute top-5 left-1/4 animate-bounce text-sm" style={{ animationDuration: "6s", color: pri }}>🍃</div>
        <div className="absolute top-12 left-2/3 animate-bounce text-sm" style={{ animationDuration: "8s", color: sec, animationDelay: "2s" }}>🍂</div>
        <div className="absolute top-20 right-10 animate-bounce text-sm" style={{ animationDuration: "5s", color: pri, animationDelay: "1s" }}>🍃</div>
      </div>
    );
  }

  return null;
};

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0)
        return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
};

const CountdownBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="rounded-xl border border-[#D8B76A]/30 bg-[#D8B76A]/10 px-3 py-2 min-w-13 text-center">
      <span className="font-serif text-2xl font-light text-white">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="mt-1 text-[9px] uppercase tracking-widest text-[#D8B76A]/70">
      {label}
    </span>
  </div>
);

const MEAL_OPTIONS = [
  "No Preference",
  "Chicken",
  "Fish",
  "Vegetarian",
  "Vegan",
];

const getInvitedGuestCount = (invitation, plusOnePolicy) => {
  const base = invitation?.allowedGuests || 1;
  if (plusOnePolicy === "plus_one_allowed") {
    return Math.min(base + 1, 10);
  }
  return base;
};

const WeddingDayParticles = () => {
  const pieces = Array.from({ length: 40 }).map((_, i) => {
    const left = `${Math.random() * 100}vw`;
    const size = `${Math.random() * 15 + 10}px`;
    const delay = `${Math.random() * 5}s`;
    const duration = `${Math.random() * 4 + 4}s`;
    const emoji = ["💖", "✨", "💍", "🌸", "🥂"][Math.floor(Math.random() * 5)];
    return {
      id: i,
      emoji,
      style: {
        left,
        fontSize: size,
        animationDelay: delay,
        animationDuration: duration,
        position: "absolute",
        top: "-50px",
        pointerEvents: "none",
        animation: "floatDown 8s linear infinite",
        opacity: Math.random() * 0.7 + 0.3,
      }
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatDown {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
          }
        }
      `}} />
      {pieces.map((p) => (
        <div key={p.id} style={p.style}>{p.emoji}</div>
      ))}
    </div>
  );
};

const InvitePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Premium state features
  const [showSpotifyPlayer, setShowSpotifyPlayer] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hiddenOverlay, setHiddenOverlay] = useState(false);
  const [mapSelectAddress, setMapSelectAddress] = useState(null);
  const [wishes, setWishes] = useState([]);
  const audioRef = useRef(null);

  const countdown = useCountdown(invitation?.userId?.weddingDate);

  const handleOpenInvitation = () => {
    setIsOpen(true);
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Playback prevented", err));
    }
    if (musicUrl && getSpotifyEmbedUrl(musicUrl)) {
      setShowSpotifyPlayer(true);
    }
    setTimeout(() => {
      setHiddenOverlay(true);
    }, 1000);
  };

  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Playback failed", err));
    }
  };
  const rsvpDeadline = invitation?.userId?.rsvpDeadline;
  const deadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName: "",
      phone: "",
      attending: "Yes",
      mealPreference: "No Preference",
      message: "",
    },
  });

  const attending = watch("attending");

  useEffect(() => {
    api
      .get(`/invitations/slug/${slug}`)
      .then((res) => {
        setInvitation(res.data);
        setValue("guestName", res.data.guestName);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));

    api
      .get(`/invitations/slug/${slug}/wishes`)
      .then((res) => {
        setWishes(res.data);
      })
      .catch(() => {});
  }, [slug, setValue]);

  // Component lifecycle hooks

  const onRsvpSubmit = async (data) => {
    try {
      await api.post("/rsvps", {
        invitationId: invitation._id,
        guestName: data.guestName,
        guestEmail: data.guestEmail || "",
        phone: data.phone,
        attending: data.attending,
        mealPreference: data.mealPreference,
        message: data.message,
      });
      navigate("/rsvp-response", {
        state: {
          partner1Name: invitation.userId?.partner1Name,
          partner2Name: invitation.userId?.partner2Name,
          weddingDate: invitation.userId?.weddingDate,
          attending: data.attending,
          registryEnabled: invitation.userId?.registryEnabled,
          registryBankName: invitation.userId?.registryBankName,
          registryAccountName: invitation.userId?.registryAccountName,
          registryAccountNumber: invitation.userId?.registryAccountNumber,
          registryNotes: invitation.userId?.registryNotes,
          honeymoonFundTarget: invitation.userId?.honeymoonFundTarget,
          honeymoonFundCurrent: invitation.userId?.honeymoonFundCurrent,
        },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit RSVP. Please try again."
      );
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `invitation-${invitation.guestName?.toLowerCase().replace(/\s+/g, "-") || "card"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const inviteUrl = `${window.location.origin}/invite/${slug}`;
    const p1 = invitation?.userId?.partner1Name || "";
    const p2 = invitation?.userId?.partner2Name || "";
    const msg = encodeURIComponent(
      `You're cordially invited to the wedding of ${p1} & ${p2}! 🎉\n\nOpen your personal invitation here:\n${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading)
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#070A13]">
        <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
          Loading your invitation...
        </p>
      </section>
    );

  if (notFound)
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#070A13] text-center px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-4">
            Not Found
          </p>
          <h1 className="font-serif text-5xl text-white mb-4">
            Invitation Not Found
          </h1>
          <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />
          <p className="text-white/60">Please check the link you received.</p>
        </div>
      </section>
    );

  const inputClass =
    "w-full rounded-xl border border-[#1A2E4A]/15 bg-white px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition";

  const venue = invitation.userId?.venue;
  const receptionLocation = invitation.userId?.receptionLocation || "";
  const weddingDate = invitation.userId?.weddingDate;
  const weddingTime = invitation?.userId?.weddingTime;
  const dressCode = invitation.userId?.dressCode || "";
  const weddingColors = invitation.userId?.weddingColors || [];
  const plusOnePolicy = invitation.userId?.plusOnePolicy || "invitation_only";
  const kidsAllowed =
    typeof invitation.userId?.kidsAllowed === "boolean"
      ? invitation.userId.kidsAllowed
      : true;
  const invitedCount = getInvitedGuestCount(invitation, plusOnePolicy);

  // Premium settings unpacked
  const cardTheme = invitation.userId?.cardTheme || "floral";
  const customCardBg = invitation.userId?.customCardBg || "";
  const customTextColor = invitation.userId?.customTextColor || "#1A2E4A";
  const customFontFamily = invitation.userId?.customFontFamily || "classic";
  const customVerticalOffset = invitation.userId?.customVerticalOffset || 0;
  const customHorizontalOffset = invitation.userId?.customHorizontalOffset || 0;
  const customTextSize = invitation.userId?.customTextSize || 1.0;
  const customTextAlign = invitation.userId?.customTextAlign || "center";
  const couplePhotoUrl = invitation.userId?.couplePhotoUrl || "";
  const pageBgTemplate = invitation.userId?.pageBgTemplate || "";
  const coupleOverlayOpacity = invitation.userId?.coupleOverlayOpacity ?? 0.45;
  let musicUrl = invitation.userId?.musicUrl || "";
  // Check if the couple has uploaded local device audio (stored in localStorage)
  // This only applies when viewing on the same device/browser where the audio was uploaded
  const ownerUserId = invitation.userId?._id;
  if (ownerUserId) {
    try {
      const localAudio = localStorage.getItem(`vowlink_local_audio_url_${ownerUserId}`);
      if (localAudio && localAudio.startsWith("data:audio")) {
        musicUrl = localAudio;
      }
    } catch {}
  }
  // Map old placeholder SoundHelix loops to actual wedding instrumentals
  if (!musicUrl.startsWith("data:") && (musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" || musicUrl === "https://archive.org/download/PianoGuysMusic/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3")) {
    musicUrl = "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3";
  } else if (!musicUrl.startsWith("data:") && musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3") {
    musicUrl = "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3";
  } else if (!musicUrl.startsWith("data:") && (musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" || musicUrl === "https://archive.org/download/CantHelpFallingInLoveWYou/Cant%20Help%20Falling%20In%20Love%20W%20You.mp3")) {
    musicUrl = "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3";
  } else if (!musicUrl.startsWith("data:") && musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3") {
    musicUrl = "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3";
  } else if (!musicUrl.startsWith("data:") && (musicUrl === "https://archive.org/download/100ClassicalMusicMasterpieces/18%20Mendelssohn%20-%20Wedding%20March.mp3" || musicUrl === "https://archive.org/download/ClassicalMusicMidi/Mendelssohn_-_Wedding_March.mp3")) {
    // Remap any old Wedding March URL to the verified working source
    musicUrl = "https://archive.org/download/wedding-march/Wedding%20March.mp3";
  }
  const galleryPhotos = invitation.userId?.galleryPhotos || [];
  const isDirectAudio = musicUrl && !getSpotifyEmbedUrl(musicUrl);

  const script = { fontFamily: "'Dancing Script', cursive" };
  const serif = { fontFamily: "'Cormorant Garamond', serif" };

  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const mapsUrl = venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
    : null;

  const receptionMapsUrl = receptionLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(receptionLocation)}`
    : null;

  const formattedTime = weddingTime
    ? new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const formattedTimeWithFormat = formattedTime;

  const fontMap = {
    classic: "'Cormorant Garamond', serif",
    serif: "'Cormorant Garamond', serif",
    script: "'Dancing Script', cursive",
    modern: "'Outfit', sans-serif",
  };
  const activeFont = fontMap[customFontFamily] || fontMap.classic;

  const { primary: priHex, secondary: secHex, tertiary: terHex, selectedBgHex } = resolveWeddingColors(weddingColors, WEDDING_COLORS);
  const isFreeUser = invitation.userId?.tier === "free";

  // Plan-based Card Theme styling configuration
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
      border: `8px double ${secHex}33`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#2E3A59",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "navy") {
    cardStyles = {
      background: "radial-gradient(circle, #0F1F38 0%, #060D18 100%)",
      border: `3px solid ${secHex}`,
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
    ];
    const isDarkBg = darkTemplates.includes(customCardBg);
    const fallbackColor = isDarkBg ? "#F5EBD6" : "#1A2E4A";
    cardStyles = {
      background: `url('${customCardBg}') center/cover no-repeat`,
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : fallbackColor,
      fontFamily: activeFont,
    };
  }

  // Adjust theme color tags
  const primaryTextColor = cardStyles.color;
  const accentColor = cardTheme === "navy" || cardTheme === "forest" || cardTheme === "stardust" ? secHex : (isFreeUser ? "#B8963A" : priHex);

  const isEnvelopeDark = ["navy", "stardust", "forest", "custom"].includes(cardTheme);
  const envelopeBg = cardTheme === "custom"
    ? "linear-gradient(to bottom, #0F172A, #070A13)"
    : cardStyles.background;
  const envelopeTextColor = isEnvelopeDark
    ? (customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6")
    : (customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#1A2E4A");
  const envelopeAccentColor = isEnvelopeDark ? secHex : (isFreeUser ? "#B8963A" : priHex);
  const pulseColor = isEnvelopeDark ? envelopeAccentColor : envelopeTextColor;

  const isTodayWeddingDay = weddingDate && (new Date(weddingDate).toDateString() === new Date().toDateString());

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#070A13" }}>
      {isTodayWeddingDay && <WeddingDayParticles />}
      {isTodayWeddingDay && (
        <div className="bg-linear-to-r from-[#D8B76A] via-[#F2D894] to-[#D8B76A] text-[#070A13] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest relative z-35 shadow-lg flex items-center justify-center gap-2">
          <span>💍</span>
          <span>Happy Wedding Day! Today is the Big Day for {invitation.userId?.partner1Name} & {invitation.userId?.partner2Name}!</span>
          <span>✨</span>
        </div>
      )}
      {/* Premium page background: deep dark with radial gold bokeh */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        {/* Dark base */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #0D1730 0%, #070A13 60%)" }} />
        
        {/* Page Background Image (Couple Photo) */}
        {couplePhotoUrl && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${couplePhotoUrl})` }}
            />
            <div 
              className="absolute inset-0 transition-all duration-300"
              style={{ backgroundColor: `rgba(0, 0, 0, ${coupleOverlayOpacity})` }}
            />
          </>
        )}

        {/* Gold shimmer top-left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #D8B76A 0%, transparent 70%)", filter: "blur(60px)" }} />
        {/* Gold shimmer bottom-right */}
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #B8963A 0%, transparent 70%)", filter: "blur(80px)" }} />
        {/* Subtle star dots */}
        <div className="absolute top-10 left-[15%] w-1 h-1 rounded-full bg-white opacity-30" />
        <div className="absolute top-24 left-[42%] w-0.5 h-0.5 rounded-full bg-white opacity-20" />
        <div className="absolute top-16 right-[25%] w-1 h-1 rounded-full bg-[#D8B76A] opacity-25" />
        <div className="absolute top-48 left-[70%] w-0.5 h-0.5 rounded-full bg-white opacity-15" />
        <div className="absolute top-[35%] left-[8%] w-1 h-1 rounded-full bg-white opacity-20" />
        <div className="absolute top-[60%] right-[12%] w-0.5 h-0.5 rounded-full bg-[#D8B76A] opacity-20" />
        <div className="absolute bottom-[30%] left-[30%] w-1 h-1 rounded-full bg-white opacity-15" />
      </div>
      {/* Direct HTML5 Audio Element */}
      {isDirectAudio && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="auto"
        />
      )}

      {/* Fullscreen Envelope Welcome Overlay */}
      {!hiddenOverlay && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out select-none ${
            isOpen
              ? "translate-y-[-100vh] opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
          }`}
          style={{
            background: envelopeBg,
            fontFamily: cardStyles.fontFamily
          }}
        >
          {renderThemeOrnaments(cardTheme, priHex, secHex, terHex, isFreeUser)}
          
          <div className="max-w-md w-full px-8 text-center flex flex-col items-center justify-center z-10">
            <p
              className="text-xs uppercase tracking-[0.4em] mb-3 opacity-60 font-semibold"
              style={{ color: envelopeTextColor }}
            >
              VowLink Invitation
            </p>
            
            <div className="my-6 h-px w-24" style={{ background: envelopeAccentColor, opacity: 0.6 }} />
            
            <p
              className="italic mb-2"
              style={{ color: envelopeTextColor, ...script, fontSize: "1.8rem" }}
            >
              You are cordially invited to the wedding of
            </p>
            
            <h1
              className="mb-8"
              style={{ color: envelopeTextColor, ...script, fontSize: "3.2rem", lineHeight: 1.1 }}
            >
              {invitation.userId?.partner1Name || "Partner 1"}
              <span className="block my-1 text-2xl font-serif not-italic opacity-80" style={{ color: envelopeTextColor }}>&</span>
              {invitation.userId?.partner2Name || "Partner 2"}
            </h1>
            
            <button
              onClick={handleOpenInvitation}
              className="relative group h-28 w-28 rounded-full flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.3)] border transition-all duration-500 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: envelopeAccentColor,
                borderColor: `${envelopeTextColor}22`,
                color: isEnvelopeDark ? "#070A13" : "#FFFFFF"
              }}
            >
              {/* Outer pulsing ring for high-contrast visibility on light/dark themes */}
              <span 
                className="absolute -inset-2 rounded-full animate-pulse pointer-events-none" 
                style={{ 
                  border: `2px solid ${pulseColor}`,
                  boxShadow: `0 0 20px ${pulseColor}${isEnvelopeDark ? "55" : "33"}`,
                  opacity: isEnvelopeDark ? 0.4 : 0.6
                }} 
              />
              {/* Inner expanding ping ring */}
              <span 
                className="absolute inset-0 rounded-full animate-ping pointer-events-none" 
                style={{ 
                  backgroundColor: pulseColor,
                  opacity: isEnvelopeDark ? 0.6 : 0.25
                }} 
              />
              <div className="absolute inset-2 rounded-full border border-dashed opacity-40" style={{ borderColor: isEnvelopeDark ? "#FFFFFF" : "#070A13" }} />
              <span className="text-2xl mb-1 z-10">✉</span>
              <span className="text-[10px] uppercase font-bold tracking-widest z-10">Open</span>
            </button>
            
            <p className="mt-8 text-[10px] uppercase tracking-[0.2em] opacity-40" style={{ color: envelopeTextColor }}>
              {musicUrl ? "Click to unveil details & play music" : "Click to unveil details"}
            </p>
          </div>
        </div>
      )}


      {/* Background Animated Stardust Effect (Pro) */}
      {cardTheme === "stardust" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[#06080F]" />
          {/* Sparkles simulation using styled animated divs */}
          <div className="absolute bottom-[-100px] left-1/4 h-2 w-2 rounded-full bg-yellow-400 opacity-60 animate-bounce" style={{ animationDuration: "5s", animationDelay: "1s" }} />
          <div className="absolute bottom-[-100px] left-1/2 h-3 w-3 rounded-full bg-white opacity-40 animate-bounce" style={{ animationDuration: "7s", animationDelay: "3s" }} />
          <div className="absolute bottom-[-100px] left-3/4 h-2 w-2 rounded-full bg-yellow-200 opacity-80 animate-bounce" style={{ animationDuration: "4s", animationDelay: "2s" }} />
          <div className="absolute bottom-[-100px] left-10 h-3 w-3 rounded-full bg-yellow-300 opacity-50 animate-bounce" style={{ animationDuration: "8s", animationDelay: "0s" }} />
        </div>
      )}

      {/* Background Animated Forest Leaves Effect (Pro) */}
      {cardTheme === "forest" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[#09150E]" />
          <div className="absolute top-10 left-10 text-xs text-amber-500/20 rotate-45 select-none text-[30px]">🍃</div>
          <div className="absolute top-40 right-20 text-xs text-amber-500/10 -rotate-12 select-none text-[24px]">🍂</div>
          <div className="absolute bottom-60 left-1/3 text-xs text-amber-500/15 rotate-90 select-none text-[20px]">🍃</div>
        </div>
      )}

      {/* Floating Audio Soundtrack Player (Spotify) */}
      {musicUrl && getSpotifyEmbedUrl(musicUrl) && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {showSpotifyPlayer && (
            <div className="w-72 sm:w-80 p-3.5 rounded-2xl bg-[#0D1220]/90 backdrop-blur-md border border-[#D8B76A]/20 shadow-2xl animate-fade-in transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A] font-semibold">Soundtrack Player</span>
                <button onClick={() => setShowSpotifyPlayer(false)} className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10">✕</button>
              </div>
              <iframe
                src={getSpotifyEmbedUrl(musicUrl)}
                width="100%"
                height="80"
                frameBorder="0"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl border border-white/5"
              ></iframe>
            </div>
          )}
          <button
            onClick={() => setShowSpotifyPlayer(!showSpotifyPlayer)}
            className={`h-12 w-12 rounded-full bg-[#1A2E4A] border border-[#D8B76A]/40 flex items-center justify-center text-lg text-[#D8B76A] shadow-xl hover:scale-110 active:scale-95 transition ${showSpotifyPlayer ? 'ring-2 ring-[#D8B76A]' : ''}`}
            title="Play background soundtrack"
          >
            🎵
          </button>
        </div>
      )}

      {/* Floating Direct Audio Play/Pause Button */}
      {isDirectAudio && isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={handleAudioToggle}
            className={`h-12 w-12 rounded-full bg-[#1A2E4A] border flex items-center justify-center text-lg shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 ${
              isPlaying ? "animate-pulse" : ""
            }`}
            style={{ borderColor: isPlaying ? accentColor : "rgba(255,255,255,0.2)" }}
            title={isPlaying ? "Pause music" : "Play music"}
          >
            <span className={isPlaying ? "animate-spin" : ""} style={{ display: "inline-block", animationDuration: "6s" }}>
              {isPlaying ? "🎵" : "🔇"}
            </span>
          </button>
        </div>
      )}

      {/* ── INVITATION CARD SECTION ── */}
      <section className="flex flex-col items-center justify-center py-10 px-4 gap-6 relative z-10">
        {/* ═══ THE CARD (this gets downloaded) ═══ */}
        <div
          ref={cardRef}
          className="w-full max-w-[24.7rem] sm:max-w-[27.2rem] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Card background container */}
          <div
            className="relative w-full overflow-hidden"
            style={cardStyles}
          >
            {renderThemeOrnaments(cardTheme, priHex, secHex, terHex, isFreeUser)}
            {/* Custom Spacing & Scaling wrapper */}
            <div
              className={`relative z-10 px-6 pt-14 pb-16 flex flex-col justify-center w-full min-h-[620px] transition-all ${
                customTextAlign === "left"
                  ? "items-start text-left"
                  : customTextAlign === "right"
                  ? "items-end text-right"
                  : "items-center text-center"
              }`}
              style={{
                fontSize: `${customTextSize}em`,
                paddingTop: `calc(5rem + ${customVerticalOffset}px)`,
                paddingBottom: `calc(5.5rem - ${customVerticalOffset}px)`,
                transform: `translateX(${customHorizontalOffset || 0}px)`,
              }}
            >
              {/* ── Wedding Invitation title ── */}
              <h2
                style={{
                  ...script,
                  fontSize: "2em",
                  lineHeight: 1.25,
                  color: primaryTextColor,
                }}
                className="mt-3"
              >
                Wedding Invitation
              </h2>

              {/* ornament divider */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px w-12" style={{ background: primaryTextColor, opacity: 0.4 }} />
                <span style={{ color: primaryTextColor, opacity: 0.6, fontSize: "0.65rem" }}>❧</span>
                <div className="h-px w-12" style={{ background: primaryTextColor, opacity: 0.4 }} />
              </div>

              {/* ── Marriage between ── */}
              <p
                style={{
                  ...script,
                  fontSize: "1.35em",
                  fontStyle: "italic",
                  color: primaryTextColor,
                }}
                className="mb-1"
              >
                Marriage between
              </p>

              {/* ── Couple names ── */}
              <h1
                style={{
                  ...script,
                  fontSize: "2.6em",
                  lineHeight: 1.1,
                  color: primaryTextColor,
                }}
                className="mb-1"
              >
                {invitation.userId?.partner1Name || "Partner 1"}{" "}
                <span style={{ color: primaryTextColor, opacity: 0.9 }}>and</span>{" "}
                {invitation.userId?.partner2Name || "Partner 2"}
              </h1>

              {/* ornament */}
              <div className="flex items-center gap-2 my-4">
                <div className="h-px w-10" style={{ background: primaryTextColor, opacity: 0.3 }} />
                <span style={{ color: primaryTextColor, opacity: 0.5, fontSize: "0.6rem" }}>✦</span>
                <div className="h-px w-10" style={{ background: primaryTextColor, opacity: 0.3 }} />
              </div>

              {/* ── You are cordially invited ── */}
              <p
                style={{
                  fontFamily: cardStyles.fontFamily,
                  fontSize: "1.05em",
                  color: primaryTextColor,
                }}
                className="mb-4"
              >
                You are cordially invited
              </p>

              {/* ── Salutation (customized greeting) ── */}
              <p
                style={{
                  ...script,
                  fontSize: "1.6em",
                  fontStyle: "italic",
                  color: primaryTextColor,
                }}
                className="mb-3"
              >
                {invitation.greeting || `Dear ${invitation.guestName},`}
              </p>

              {/* ── Custom message ── */}
              <p
                style={{
                  fontFamily: cardStyles.fontFamily,
                  fontSize: "1em",
                  lineHeight: 1.8,
                  color: primaryTextColor,
                }}
                className="mb-5 max-w-60"
              >
                {invitation.customMessage}
              </p>

              {/* ── Date ── */}
              {formattedDate && (
                <p
                  style={{
                    fontFamily: cardStyles.fontFamily,
                    fontSize: "0.95em",
                    color: primaryTextColor,
                  }}
                  className="mb-2"
                >
                  Date : {formattedDate}
                </p>
              )}

              {/* ── Time ── */}
              <p
                style={{
                  fontFamily: cardStyles.fontFamily,
                  fontSize: "0.95em",
                  color: primaryTextColor,
                }}
                className="mb-2"
              >
                Time : {formattedTimeWithFormat || "To be announced"}
              </p>

              {/* ── Venue (clickable → Maps Selector Modal) ── */}
              {venue && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMapSelectAddress(venue);
                  }}
                  style={{
                    fontFamily: cardStyles.fontFamily,
                    fontSize: "0.95em",
                    color: primaryTextColor,
                    textDecoration: "underline",
                    textDecorationColor: `${accentColor}55`,
                    textUnderlineOffset: "3px",
                  }}
                  className="mb-2 hover:opacity-80 transition block w-full max-w-[260px] break-words whitespace-normal px-2 text-center mx-auto"
                >
                  Location: {venue}
                </button>
              )}

              {receptionLocation && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMapSelectAddress(receptionLocation);
                  }}
                  style={{
                    fontFamily: cardStyles.fontFamily,
                    fontSize: "0.95em",
                    color: primaryTextColor,
                    textDecoration: "underline",
                    textDecorationColor: `${accentColor}55`,
                    textUnderlineOffset: "3px",
                  }}
                  className="mb-5 hover:opacity-80 transition block w-full max-w-[260px] break-words whitespace-normal px-2 text-center mx-auto"
                >
                  Reception at: {receptionLocation}
                </button>
              )}

              {/* bottom ornament */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8" style={{ background: primaryTextColor, opacity: 0.3 }} />
                <span style={{ color: primaryTextColor, opacity: 0.5, fontSize: "0.6rem" }}>◆</span>
                <div className="h-px w-8" style={{ background: primaryTextColor, opacity: 0.3 }} />
              </div>

              {/* Colors */}
              {weddingColors.length > 0 && (
                <div className="mb-4">
                  <p
                    style={{
                      fontFamily: cardStyles.fontFamily,
                      fontSize: "0.7em",
                      letterSpacing: "0.12em",
                      color: primaryTextColor,
                      opacity: 0.8,
                    }}
                    className="uppercase mb-2"
                  >
                    Colour of the Day
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {weddingColors.map((name, i) => {
                      const hex = WEDDING_COLORS.find((c) => c.name === name)?.hex || "#999";
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-7 rounded-full shadow-md"
                            style={{
                              background: hex,
                              border: "2px solid rgba(26,46,74,0.25)",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: cardStyles.fontFamily,
                              fontSize: "0.9em",
                              fontWeight: 700,
                              color: primaryTextColor,
                              lineHeight: 1.3,
                            }}
                            className="text-center max-w-16 font-bold"
                          >
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category badge */}
              <p
                style={{
                  fontFamily: cardStyles.fontFamily,
                  fontSize: "1.25rem",
                  letterSpacing: "0.18em",
                  color: primaryTextColor,
                  fontWeight: 700,
                }}
                className="uppercase"
              >
                {invitation.category || "Guest"}
              </p>
            </div>
          </div>
        </div>
        {/* ═══ END CARD ═══ */}

        {/* ── Countdown (outside card, not downloaded) ── */}
        {countdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
          <div className="w-full max-w-[24.7rem] sm:max-w-[27.2rem]">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-[#D8B76A] mb-3">
              Counting Down
            </p>
            <div className="flex items-end justify-center gap-2">
              <CountdownBox value={countdown.days} label="Days" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.hours} label="Hours" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.minutes} label="Mins" />
              <span className="mb-4 text-[#D8B76A] font-light text-xl">:</span>
              <CountdownBox value={countdown.seconds} label="Secs" />
            </div>
          </div>
        )}

        {/* RSVP Deadline badge */}
        {rsvpDeadline && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 ${
              deadlinePassed
                ? "border-red-400/30 bg-red-400/10 text-red-400"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            }`}
          >
            <span>{deadlinePassed ? "🔒" : "⏰"}</span>
            <p className="text-xs font-medium">
              {deadlinePassed
                ? "RSVP is now closed"
                : `RSVP by ${new Date(rsvpDeadline).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`}
            </p>
          </div>
        )}

        {/* RSVP Status / Button */}
        {invitation.hasRSVPed ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-8 py-4">
            <p className="text-sm text-emerald-400">✓ We've received your RSVP. Thank you!</p>
          </div>
        ) : deadlinePassed ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-8 py-4">
            <p className="text-sm text-red-400">🔒 RSVP is now closed.</p>
          </div>
        ) : (
          <button
            id="rsvp-open-btn"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.45)]"
          >
            ✦ RSVP Now
          </button>
        )}

        {/* Download & Share */}
        <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-full border border-[#D8B76A]/40 bg-[#1A2E4A]/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] backdrop-blur-sm transition hover:bg-[#1A2E4A] hover:shadow-[0_8px_24px_rgba(216,183,106,0.2)] disabled:opacity-50"
          >
            {downloading ? (
              <span className="animate-pulse">Downloading…</span>
            ) : (
              <>
                <span>⬇</span> Download
              </>
            )}
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#25D366] backdrop-blur-sm transition hover:bg-[#25D366]/25"
          >
            <span>📲</span> Share
          </button>
        </div>
      </section>

      {/* Love Story Couple Gallery Section (Plus/Pro) */}
      {galleryPhotos.length > 0 && (
        <section className="px-4 py-16 bg-[#090D19] border-t border-white/5 relative z-10 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-2 text-center">Love Story</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 text-center">Our Gallery</h2>

          <div className="w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 bg-[#070A13] p-4 flex flex-col items-center">
            {/* Big slide */}
            <div className="w-full h-80 rounded-2xl overflow-hidden bg-white/5 relative">
              <img
                src={galleryPhotos[galleryIndex]}
                alt="Couple"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {/* Carousel controls — SVG chevron arrows */}
              <button
                onClick={() => setGalleryIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group"
                aria-label="Previous photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/70 group-hover:text-[#D8B76A] transition-colors">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setGalleryIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group"
                aria-label="Next photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/70 group-hover:text-[#D8B76A] transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Thumbnails list */}
            <div className="flex gap-2.5 mt-4 flex-wrap justify-center">
              {galleryPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`h-11 w-11 rounded-lg overflow-hidden border transition ${
                    i === galleryIndex ? "border-[#D8B76A]" : "border-white/10 opacity-50"
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Details Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 text-center bg-[#070A13] relative z-10 border-t border-white/5">
        <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">The Details</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 sm:mb-10">Wedding Day</h2>
        <div className="mx-auto max-w-4xl grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Date */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">◈</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Date</p>
            <p className="text-white text-sm leading-6">
              {weddingDate
                ? new Date(weddingDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "To be announced"}
            </p>
          </div>

          {/* Time */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">⏰</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Time</p>
            <p className="text-white text-sm leading-6">
              {formattedTimeWithFormat || "To be announced"}
            </p>
          </div>

          {/* Venue */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">📍</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Venue</p>
            {venue ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMapSelectAddress(venue);
                }}
                style={{
                  ...serif,
                  fontSize: "0.95rem",
                  color: "gainsboro",
                  textDecoration: "underline",
                  textDecorationColor: "#B8963A55",
                  textUnderlineOffset: "3px",
                }}
                className="hover:opacity-80 transition block w-full text-center"
              >
                {venue}
              </button>
            ) : (
              <p className="text-white text-sm leading-6">To be announced</p>
            )}
          </div>

          {receptionLocation && (
            <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
              <span className="text-2xl text-[#D8B76A]">🥂</span>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Reception at</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMapSelectAddress(receptionLocation);
                }}
                style={{
                  ...serif,
                  fontSize: "0.95rem",
                  color: "gainsboro",
                  textDecoration: "underline",
                  textDecorationColor: "#B8963A55",
                  textUnderlineOffset: "3px",
                }}
                className="hover:opacity-80 transition block w-full text-center"
              >
                {receptionLocation}
              </button>
            </div>
          )}

          {/* Dress Code */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">👔</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Dress Code</p>
            <p className="text-white text-sm leading-6">{dressCode || "To be announced"}</p>
          </div>

          {/* Colour of the Day */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">🎨</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-3">Colour of the Day</p>
            {weddingColors.length > 0 ? (
              <div className="flex justify-center flex-wrap gap-2">
                {weddingColors.map((name, i) => {
                  const hex = WEDDING_COLORS.find((c) => c.name === name)?.hex || "#999";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 shadow-sm"
                    >
                      <div className="h-4 w-4 rounded-full shrink-0 shadow-inner" style={{ background: hex }} />
                      <span className="text-base font-bold text-white tracking-wide">{name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white text-sm">To be announced</p>
            )}
          </div>

          {/* Your Category */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">✦</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Your Category</p>
            <p className="text-white text-sm leading-6">{invitation.category || "Guest"}</p>
          </div>

          {/* Additional guest policy */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">➕</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Additional Guest</p>
            <p className="text-white text-sm leading-6">
              {plusOnePolicy === "plus_one_allowed" ? "Plus one allowed" : "Strictly by invitation"}
            </p>
          </div>

          {/* Children policy */}
          <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
            <span className="text-2xl text-[#D8B76A]">🧒</span>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Children</p>
            <p className="text-white text-sm leading-6">
              {kidsAllowed ? "Children are welcome" : "Adults only"}
            </p>
          </div>
        </div>
      </section>

      {/* RSVP MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D8B76A]/20 bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#1A2E4A]">Your RSVP</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#1A2E4A]/40 hover:text-[#1A2E4A] transition text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onRsvpSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Name *</label>
                <input
                  id="rsvp-name"
                  {...register("guestName")}
                  className={`${inputClass} ${errors.guestName ? "border-red-400/50" : ""}`}
                />
                {errors.guestName && (
                  <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Phone Number *
                </label>
                <input
                  id="rsvp-phone"
                  placeholder="+234 800 000 0000"
                  {...register("phone")}
                  className={`${inputClass} ${errors.phone ? "border-red-400/50" : ""}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              {/* Optional Email for confirmation */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Email <span className="text-[#1A2E4A]/30 normal-case">(optional — for confirmation)</span>
                </label>
                <input
                  id="rsvp-email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("guestEmail")}
                  className={`${inputClass} ${errors.guestEmail ? "border-red-400/50" : ""}`}
                />
                {errors.guestEmail && <p className="mt-1 text-xs text-red-500">{errors.guestEmail.message}</p>}
              </div>

              {/* Attending toggle */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Will you attend? *
                </label>
                <Controller
                  name="attending"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`flex-1 rounded-xl border py-3 text-sm font-medium transition ${
                            field.value === opt
                              ? opt === "Yes"
                                ? "border-emerald-500/50 bg-emerald-50 text-emerald-700"
                                : "border-red-400/50 bg-red-50 text-red-600"
                              : "border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20"
                          }`}
                        >
                          {opt === "Yes" ? "✓ Yes" : "✗ No"}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {attending === "Yes" && (
                <div className="rounded-xl border border-[#B8963A]/30 bg-[#D8B76A]/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-[#B8963A]/80 mb-1">
                    Your invitation
                  </p>
                  <p className="text-sm text-[#1A2E4A]">
                    {plusOnePolicy === "plus_one_allowed"
                      ? `You're confirming attendance for ${invitedCount} guest${
                          invitedCount === 1 ? "" : "s"
                        } (${invitation.allowedGuests || 1} on your invitation + 1 plus one).`
                      : `You're confirming attendance for ${invitedCount} guest${
                          invitedCount === 1 ? "" : "s"
                        } as listed on your invitation.`}
                  </p>
                </div>
              )}

              {/* Meal preference */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Meal Preference
                </label>
                <Controller
                  name="mealPreference"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {MEAL_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                            field.value === opt
                              ? "border-[#B8963A]/60 bg-[#D8B76A]/15 text-[#B8963A]"
                              : "border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
                  Message (optional)
                </label>
                <textarea
                  id="rsvp-message"
                  rows={3}
                  placeholder="A note for the couple..."
                  {...register("message")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                id="rsvp-submit-btn"
                disabled={isSubmitting}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.4)] disabled:opacity-60 mt-2"
              >
                {isSubmitting ? "Sending..." : "Submit RSVP"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gift Registry Section */}
      {invitation.userId?.registryEnabled && (
        <section className="px-4 sm:px-6 py-16 text-center bg-[#090D19] relative z-10 border-t border-white/5 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">Gifting</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">Gift Registry & Honeymoon Fund</h2>
          
          <div className="w-full max-w-xl rounded-3xl border border-[#D8B76A]/30 bg-[#070A13]/90 p-6 sm:p-8 shadow-2xl space-y-8 text-left relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-9xl">🎁</div>
            
            {invitation.userId?.registryNotes && (
              <p className="text-sm text-white/70 text-center leading-relaxed italic border-b border-white/5 pb-6">
                "{invitation.userId.registryNotes}"
              </p>
            )}

            {/* Honeymoon Fund progress bar */}
            {invitation.userId?.honeymoonFundTarget > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">🍯 Honeymoon Fund Tracker</h4>
                    <p className="text-xs text-white/40 font-normal">Help us create memories of a lifetime.</p>
                  </div>
                  <span className="text-base font-serif text-[#D8B76A] font-semibold">
                    {invitation.userId.honeymoonFundCurrent >= invitation.userId.honeymoonFundTarget ? (
                      <span className="text-[#3EC58E] flex items-center gap-1 font-bold animate-pulse">🎉 Goal Reached!</span>
                    ) : (
                      `${Math.min(Math.round((invitation.userId.honeymoonFundCurrent / invitation.userId.honeymoonFundTarget) * 100), 100)}% Reached`
                    )}
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-white/5 overflow-hidden relative border border-white/10 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      invitation.userId.honeymoonFundCurrent >= invitation.userId.honeymoonFundTarget
                        ? "bg-linear-to-r from-[#3EC58E] to-[#34D399] animate-pulse shadow-[0_0_15px_rgba(62,197,142,0.6)]"
                        : "bg-linear-to-r from-[#D8B76A] to-[#F2D894] shadow-[0_0_10px_rgba(216,183,106,0.4)]"
                    }`}
                    style={{ width: `${Math.min(Math.round((invitation.userId.honeymoonFundCurrent / invitation.userId.honeymoonFundTarget) * 100), 100)}%` }}
                  />
                </div>
                {invitation.userId.honeymoonFundCurrent >= invitation.userId.honeymoonFundTarget && (
                  <p className="text-[10px] text-[#3EC58E] font-medium text-center italic mt-1 animate-fade-in">
                    Target goal fully funded! Thank you so much for your immense generosity! ❤️
                  </p>
                )}
              </div>
            )}

            {/* Bank details info */}
            {invitation.userId?.registryAccountNumber && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">🏦 Bank Transfer Details</h4>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Bank Name</span>
                      <span className="text-white font-medium">{invitation.userId.registryBankName || "Not Specified"}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Account Name</span>
                      <span className="text-white font-medium">{invitation.userId.registryAccountName || "Not Specified"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 sm:p-4 border border-white/5">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Account Number</span>
                      <span className="text-white font-mono text-base tracking-wide font-bold">{invitation.userId.registryAccountNumber}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invitation.userId.registryAccountNumber);
                        toast.success("Account number copied! 📋");
                      }}
                      className="px-4 py-2 rounded-lg bg-[#D8B76A] text-[#070A13] text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition"
                    >
                      Copy Number
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Wish Wall / Guestbook Section */}
      {wishes.length > 0 && (
        <section className="px-4 sm:px-6 py-16 text-center bg-[#070A13] relative z-10 border-t border-white/5 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">Congratulations</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">The Wish Wall</h2>
          <p className="text-white/40 text-xs max-w-sm mb-10 -mt-4 leading-relaxed font-normal">
            Beautiful wishes and congratulations from our dear guests who are attending.
          </p>
          
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.map((w, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] text-left relative overflow-hidden flex flex-col justify-between min-h-36 hover:border-[#D8B76A]/40 transition duration-300 shadow-lg"
              >
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none text-4xl font-serif">“</div>
                <p className="text-white/80 text-sm leading-relaxed italic mb-4 font-normal">
                  "{w.message}"
                </p>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
                  <span className="text-xs font-bold text-[#D8B76A] uppercase tracking-wider truncate max-w-28 font-semibold">
                    {w.guestName}
                  </span>
                  <span className="text-[9px] text-white/30">
                    {new Date(w.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short"
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map Selector Modal */}
      {mapSelectAddress && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 shadow-2xl space-y-6 text-center">
            <div>
              <span className="text-3xl">🧭</span>
              <h3 className="font-serif text-xl text-white mt-2">Open in Maps</h3>
              <p className="text-white/40 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
                Choose your preferred navigation app to open routes for:<br />
                <span className="text-white/80 font-medium block mt-1 break-words">{mapSelectAddress}</span>
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Google Maps */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSelectAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMapSelectAddress(null)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
              >
                <span>🗺️</span> Google Maps
              </a>
              
              {/* Apple Maps */}
              <a
                href={`https://maps.apple.com/?q=${encodeURIComponent(mapSelectAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMapSelectAddress(null)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
              >
                <span>🍎</span> Apple Maps
              </a>
              
              {/* Waze */}
              <a
                href={`https://waze.com/ul?q=${encodeURIComponent(mapSelectAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMapSelectAddress(null)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
              >
                <span>🚗</span> Waze
              </a>
            </div>
            
            <button
              onClick={() => setMapSelectAddress(null)}
              className="w-full text-xs font-bold uppercase tracking-widest text-[#D8B76A] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitePage;
