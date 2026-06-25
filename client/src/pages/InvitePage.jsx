import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { toPng } from "html-to-image";
import { getTemplateLayout, getBlockStyles } from "../utils/templateLayouts";
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

const isDarkColor = (hex) => {
  if (!hex || hex === '#999') return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 120;
};

const resolveWeddingColors = (colors, defaultColorsList) => {
  const colorMap = {};
  defaultColorsList.forEach(c => {
    colorMap[c.name.toLowerCase()] = c.hex;
  });

  const hexList = (colors || []).map(name => colorMap[name.toLowerCase()]).filter(Boolean);

  const primary = hexList[0] || "#1A2E4A"; // Default Navy
  
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
    return null;
  }

  if (theme === "stardust") {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes invite-sd-ping { 75%,100% { transform: scale(2); opacity: 0; } }
          @keyframes invite-sd-pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.35; } }
        `}</style>
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full blur-[60px] opacity-25" style={{ backgroundColor: pri }} />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-[60px] opacity-20" style={{ backgroundColor: sec }} />
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white opacity-80" style={{ animation: "invite-sd-ping 3s cubic-bezier(0,0,0.2,1) infinite" }} />
        <div className="absolute top-1/3 right-12 w-1.5 h-1.5 rounded-full bg-white opacity-60" style={{ animation: "invite-sd-ping 5s cubic-bezier(0,0,0.2,1) infinite" }} />
        <div className="absolute bottom-1/3 left-16 w-2.5 h-2.5 rounded-full bg-white opacity-40" style={{ animation: "invite-sd-pulse 4s cubic-bezier(0.4,0,0.6,1) infinite" }} />
        <div className="absolute bottom-20 right-20 w-2 h-2 rounded-full bg-white opacity-90" style={{ animation: "invite-sd-pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite" }} />
      </div>
    );
  }

  if (theme === "forest") {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes invite-forest-bounce {
            0%,100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
            50% { transform: translateY(-15px); animation-timing-function: cubic-bezier(0,0,0.2,1); }
          }
        `}</style>
        <svg className="absolute top-0 left-0 w-full h-20 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,0 Q10,8 20,2 Q30,12 40,4 Q50,15 60,3 Q70,12 80,2 Q90,10 100,0" stroke={sec} strokeWidth="1.2" fill="none" />
          <circle cx="10" cy="5" r="2" fill={pri} />
          <circle cx="28" cy="7" r="2.5" fill={sec} />
          <circle cx="48" cy="9" r="2.2" fill={pri} />
          <circle cx="68" cy="8" r="2" fill={sec} />
          <circle cx="88" cy="6" r="1.8" fill={pri} />
        </svg>
        <div className="absolute top-5 left-1/4 text-sm" style={{ animation: "invite-forest-bounce 6s infinite", color: pri }}>🍃</div>
        <div className="absolute top-12 left-2/3 text-sm" style={{ animation: "invite-forest-bounce 8s infinite", animationDelay: "2s", color: sec }}>🍂</div>
        <div className="absolute top-20 right-10 text-sm" style={{ animation: "invite-forest-bounce 5s infinite", animationDelay: "1s", color: pri }}>🍃</div>
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

const renderFrameBorder = (frameBorder) => {
  if (!frameBorder) return null;
  
  if (frameBorder === "gold-royal") {
    return (
      <div className="absolute inset-5 border-2 border-[#D8B76A]/40 pointer-events-none rounded-xl z-0">
        <div className="absolute inset-1 border border-[#D8B76A]/20" />
        {/* Decorative corner lines */}
        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#D8B76A]" />
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#D8B76A]" />
        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#D8B76A]" />
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#D8B76A]" />
      </div>
    );
  }
  
  if (frameBorder === "lace") {
    return (
      <div className="absolute inset-4 border border-[#B8963A]/25 pointer-events-none rounded-xl z-0">
        <div className="absolute top-0 bottom-0 left-2 right-2 border-l border-r border-[#B8963A]/10 border-dashed" />
        <div className="absolute left-0 right-0 top-2 bottom-2 border-t border-b border-[#B8963A]/10 border-dashed" />
      </div>
    );
  }
  
  if (frameBorder === "dashed-gold") {
    return (
      <div className="absolute inset-6 border border-dashed border-[#D8B76A]/35 pointer-events-none rounded-lg z-0" />
    );
  }
  
  if (frameBorder === "gold-thin") {
    return (
      <div className="absolute inset-4 border border-[#D8B76A]/25 pointer-events-none rounded-xl z-0" />
    );
  }
  
  if (frameBorder === "eucalyptus") {
    return (
      <div className="absolute inset-5 border border-[#A3B899]/20 pointer-events-none rounded-2xl z-0" />
    );
  }

  if (frameBorder === "gold") {
    return (
      <div className="absolute inset-4 border-2 border-[#C9A84C]/30 pointer-events-none rounded-xl z-0">
        <div className="absolute inset-0.5 border border-[#C9A84C]/10" />
      </div>
    );
  }

  if (frameBorder === "minimalist") {
    return (
      <div className="absolute inset-4 border border-slate-300 pointer-events-none z-0" />
    );
  }

  return null;
};

const renderOrnamentDivider = (dividerType, color, spacing = "my-3", isSecondary = false) => {
  const lineStyle = { background: color, opacity: isSecondary ? 0.3 : 0.4 };
  const char = isSecondary ? "✦" : "❧";
  
  // Choose character based on divider type
  let finalChar = char;
  if (dividerType === "floral-rose") finalChar = isSecondary ? "🥀" : "🌸";
  else if (dividerType === "leaf-right") finalChar = isSecondary ? "🌿" : "🍃";
  else if (dividerType === "eucalyptus") finalChar = "🌿";
  else if (dividerType === "lace") finalChar = isSecondary ? "✧" : "✦";
  else if (dividerType === "gold-royal") finalChar = isSecondary ? "✦" : "👑";
  else if (dividerType === "gold-foil") finalChar = "✦";
  else if (dividerType === "starry") finalChar = isSecondary ? "✦" : "✨";
  else if (dividerType === "glitter") finalChar = isSecondary ? "✧" : "✨";
  else if (dividerType === "filigree") finalChar = isSecondary ? "✥" : "❦";
  else if (dividerType === "charcoal-gold") finalChar = isSecondary ? "✦" : "✧";
  
  if (dividerType === "gold-royal") {
    return (
      <div className={`flex items-center gap-2 select-none ${spacing}`}>
        <div className="h-[1.5px] w-12 bg-linear-to-r from-transparent to-[#D8B76A]" />
        <span className="text-[#D8B76A] text-[11px] font-bold">{finalChar}</span>
        <div className="h-[1.5px] w-12 bg-linear-to-l from-transparent to-[#D8B76A]" />
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 select-none ${spacing}`}>
      <div className="h-px w-10" style={lineStyle} />
      <span style={{ color: dividerType?.includes("gold") || dividerType === "glitter" ? "#D8B76A" : color }} className="text-[11px]">{finalChar}</span>
      <div className="h-px w-10" style={lineStyle} />
    </div>
  );
};

const renderTemplateBackgroundGraphics = (customCardBg, priHex, secHex, terHex, isFreeUser) => {
  if (!customCardBg) return null;

  if (customCardBg === "/templates/Blush Pink Watercolor.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="85" cy="115" r="30" fill="#FFE5E9" opacity="0.6" filter="blur(10px)" />
        <circle cx="95" cy="50" r="25" fill="#FFF0F2" opacity="0.8" filter="blur(8px)" />
        <path d="M100,20 Q80,40 85,60 Q90,80 100,90" stroke="#C3A38A" strokeWidth="1" opacity="0.6" />
        <path d="M100,50 Q75,70 80,95 Q85,120 100,130" stroke="#C3A38A" strokeWidth="1.2" opacity="0.5" />
        <circle cx="82" cy="55" r="5" fill="#F4B2B9" opacity="0.9" />
        <circle cx="78" cy="85" r="6" fill="#F4B2B9" opacity="0.95" />
        <circle cx="81" cy="110" r="5.5" fill="#F4B2B9" opacity="0.9" />
        <path d="M78,51 C73,48 70,52 78,55" fill="#B2C8B2" opacity="0.8" />
        <path d="M72,83 C67,80 64,84 72,87" fill="#B2C8B2" opacity="0.8" />
        <path d="M84,89 C82,94 86,96 84,89" fill="#B2C8B2" opacity="0.8" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Cream Floral Elegance.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="15" cy="35" r="35" fill="#F4ECE1" opacity="0.7" filter="blur(12px)" />
        <circle cx="10" cy="100" r="30" fill="#EFE5D8" opacity="0.6" filter="blur(10px)" />
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

  if (customCardBg === "/templates/template_free_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes floatGoldDust1 {
            0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0.2; }
            50% { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.6; }
            100% { transform: translateY(-16px) translateX(0px) scale(0.8); opacity: 0.2; }
          }
        `}</style>
        {/* Soft floating gold dust particles that overlay on top of the cream background */}
        <circle cx="15" cy="35" r="0.7" fill="#D8B76A" style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }} />
        <circle cx="25" cy="115" r="0.5" fill="#D8B76A" style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }} />
        <circle cx="80" cy="45" r="0.6" fill="#D8B76A" style={{ animation: "floatGoldDust1 7s ease-in-out infinite 4s" }} />
        <circle cx="75" cy="105" r="0.8" fill="#D8B76A" style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }} />
        <circle cx="45" cy="20" r="0.5" fill="#D8B76A" style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }} />
        <circle cx="55" cy="130" r="0.6" fill="#D8B76A" style={{ animation: "floatGoldDust1 7s ease-in-out infinite 4s" }} />
        <circle cx="90" cy="85" r="0.5" fill="#D8B76A" style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }} />
        <circle cx="12" cy="80" r="0.7" fill="#D8B76A" style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }} />
      </svg>
    );
  }

  if (customCardBg === "/templates/Emerald Eucalyptus Frame.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes rustlePlusLeaves {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(1.5deg) scale(1.02); }
          }
        `}</style>
        <rect x="5" y="5" width="90" height="140" rx="6" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <g style={{ animation: "rustlePlusLeaves 5s ease-in-out infinite", transformOrigin: "center" }}>
          <path d="M6,6 Q20,8 15,22 Q12,30 6,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          <circle cx="12" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M14,15 C10,13 10,20 14,21 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="18" cy="8" r="2" fill="#A3B899" />
        </g>
        <g style={{ animation: "rustlePlusLeaves 6s ease-in-out infinite 1.5s", transformOrigin: "center" }}>
          <path d="M94,6 Q80,8 85,22 Q88,30 94,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          <circle cx="88" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M86,15 C90,13 90,20 86,21 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="82" cy="8" r="2" fill="#A3B899" />
        </g>
        <g style={{ animation: "rustlePlusLeaves 6s ease-in-out infinite 1.5s", transformOrigin: "center" }}>
          <path d="M6,144 Q20,142 15,128 Q12,120 6,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          <circle cx="12" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M14,135 C10,137 10,130 14,129 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="18" cy="142" r="2" fill="#A3B899" />
        </g>
        <g style={{ animation: "rustlePlusLeaves 5s ease-in-out infinite", transformOrigin: "center" }}>
          <path d="M94,144 Q80,142 85,128 Q88,120 94,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          <circle cx="88" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M86,135 C90,137 90,130 86,129 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="82" cy="142" r="2" fill="#A3B899" />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/Royal Navy Lace Accent.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes laceGlow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
        <line x1="10" y1="0" x2="10" y2="150" stroke="#D8B76A" strokeWidth="0.75" style={{ animation: "laceGlow 4s ease-in-out infinite" }} />
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.2" />
        <path d="M10,10 Q6,15 10,20 M10,30 Q6,35 10,40 M10,50 Q6,55 10,60 M10,70 Q6,75 10,80 M10,90 Q6,95 10,100 M10,110 Q6,115 10,120 M10,130 Q6,135 10,140" stroke="#D8B76A" strokeWidth="0.5" style={{ animation: "laceGlow 4s ease-in-out infinite" }} />
        <path d="M0,0 Q18,0 18,18 Q0,18 0,0 Z" fill="#D8B76A" opacity="0.12" />
        <path d="M0,150 Q18,150 18,132 Q0,132 0,150 Z" fill="#D8B76A" opacity="0.12" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Elegant purple and silver floral.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes floatSilverDust {
            0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0.15; }
            50% { transform: translateY(-10px) translateX(5px) scale(1.25); opacity: 0.6; }
            100% { transform: translateY(-20px) translateX(0px) scale(0.8); opacity: 0.15; }
          }
        `}</style>
        <circle cx="15" cy="35" r="0.8" fill="#D8B76A" style={{ animation: "floatSilverDust 7s ease-in-out infinite" }} opacity="0.3" />
        <circle cx="25" cy="115" r="0.6" fill="#9F86C0" style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }} />
        <circle cx="80" cy="45" r="0.7" fill="#E0AAFF" style={{ animation: "floatSilverDust 8s ease-in-out infinite 5s" }} />
        <circle cx="75" cy="105" r="0.9" fill="#D8B76A" style={{ animation: "floatSilverDust 7s ease-in-out infinite" }} opacity="0.3" />
        <circle cx="45" cy="20" r="0.6" fill="#E0AAFF" style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }} />
        <circle cx="55" cy="130" r="0.7" fill="#9F86C0" style={{ animation: "floatSilverDust 8s ease-in-out infinite 5s" }} />
        <circle cx="90" cy="85" r="0.6" fill="#D8B76A" style={{ animation: "floatSilverDust 7s ease-in-out infinite" }} opacity="0.2" />
        <circle cx="12" cy="80" r="0.8" fill="#E0AAFF" style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }} />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_plus_3.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes floatGoldDust2 {
            0% { transform: translateY(0px) translateX(0px) scale(0.7); opacity: 0.15; }
            50% { transform: translateY(-12px) translateX(6px) scale(1.3); opacity: 0.7; }
            100% { transform: translateY(-24px) translateX(0px) scale(0.7); opacity: 0.15; }
          }
        `}</style>
        <circle cx="20" cy="40" r="0.8" fill="#D8B76A" style={{ animation: "floatGoldDust2 5s ease-in-out infinite" }} />
        <circle cx="30" cy="110" r="0.6" fill="#D8B76A" style={{ animation: "floatGoldDust2 7s ease-in-out infinite 1.5s" }} />
        <circle cx="75" cy="50" r="0.7" fill="#D8B76A" style={{ animation: "floatGoldDust2 6s ease-in-out infinite 3s" }} />
        <circle cx="80" cy="100" r="0.9" fill="#D8B76A" style={{ animation: "floatGoldDust2 8s ease-in-out infinite 4.5s" }} />
        <circle cx="40" cy="30" r="0.5" fill="#D8B76A" style={{ animation: "floatGoldDust2 7s ease-in-out infinite 1.5s" }} />
        <circle cx="60" cy="120" r="0.7" fill="#D8B76A" style={{ animation: "floatGoldDust2 5s ease-in-out infinite" }} />
        <circle cx="85" cy="80" r="0.6" fill="#D8B76A" style={{ animation: "floatGoldDust2 6s ease-in-out infinite 3s" }} />
        <circle cx="15" cy="70" r="0.8" fill="#D8B76A" style={{ animation: "floatGoldDust2 8s ease-in-out infinite 4.5s" }} />
      </svg>
    );
  }

  if (customCardBg === "/templates/Midnight Black Floral2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes floatGoldDust3 {
            0% { transform: translateY(0px) translateX(0px) scale(0.7); opacity: 0.15; }
            50% { transform: translateY(-15px) translateX(8px) scale(1.35); opacity: 0.75; }
            100% { transform: translateY(-30px) translateX(0px) scale(0.7); opacity: 0.15; }
          }
        `}</style>
        <circle cx="25" cy="45" r="0.8" fill="#D8B76A" style={{ animation: "floatGoldDust3 6s ease-in-out infinite" }} />
        <circle cx="35" cy="115" r="0.6" fill="#F5EBD6" style={{ animation: "floatGoldDust3 8s ease-in-out infinite 2s" }} />
        <circle cx="70" cy="55" r="0.7" fill="#D8B76A" style={{ animation: "floatGoldDust3 7s ease-in-out infinite 4s" }} />
        <circle cx="85" cy="95" r="0.9" fill="#F5EBD6" style={{ animation: "floatGoldDust3 6s ease-in-out infinite" }} />
        <circle cx="45" cy="25" r="0.5" fill="#D8B76A" style={{ animation: "floatGoldDust3 8s ease-in-out infinite 2s" }} />
        <circle cx="65" cy="125" r="0.7" fill="#F5EBD6" style={{ animation: "floatGoldDust3 7s ease-in-out infinite 4s" }} />
      </svg>
    );
  }

  if (customCardBg === "/templates/Dark Black Gold Marble.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes veinGlow {
            0%, 100% { opacity: 0.5; stroke-width: 0.8px; filter: drop-shadow(0 0 1px rgba(216,183,106,0.3)); }
            50% { opacity: 0.95; stroke-width: 1.2px; filter: drop-shadow(0 0 5px rgba(216,183,106,0.9)); }
          }
        `}</style>
        <path d="M100,5 Q70,40 85,75 Q100,110 80,145" stroke="#D8B76A" style={{ animation: "veinGlow 4s ease-in-out infinite" }} fill="none" />
        <path d="M100,35 Q85,55 92,80 Q99,105 100,120" stroke="#D8B76A" style={{ animation: "veinGlow 5s ease-in-out infinite 2.2s" }} fill="none" />
        <path d="M100,70 Q90,95 93,115 Q96,135 100,140" stroke="#D8B76A" style={{ animation: "veinGlow 4s ease-in-out infinite" }} fill="none" />
        <circle cx="88" cy="20" r="1" fill="#D8B76A" opacity="0.4" />
        <circle cx="94" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="82" cy="95" r="0.75" fill="#D8B76A" opacity="0.3" />
        <circle cx="91" cy="130" r="1.2" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Burgundy Velvet Filigree.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes filigreeSpin {
            0% { transform: rotate(0deg); opacity: 0.7; }
            50% { opacity: 0.95; }
            100% { transform: rotate(360deg); opacity: 0.7; }
          }
        `}</style>
        <path d="M0,15 A15,15 0 0,0 15,0 L0,0 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,15 A15,15 0 0,0 15,0" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,12 A12,12 0 0,0 12,0" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        <path d="M0,135 A15,15 0 0,1 15,150 L0,150 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,135 A15,15 0 0,1 15,150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,138 A12,12 0 0,1 12,150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <g style={{ animation: "filigreeSpin 25s linear infinite", transformOrigin: "12px 75px" }}>
          <circle cx="12" cy="75" r="8" stroke="#D8B76A" strokeWidth="0.5" strokeDasharray="2,2" />
          <path d="M12,65 L12,85 M2,75 L22,75" stroke="#D8B76A" strokeWidth="0.5" />
        </g>
        <circle cx="12" cy="75" r="2.5" fill="#D8B76A" />
        <path d="M12,38 A7,7 0 0,1 12,52" stroke="#D8B76A" strokeWidth="0.75" fill="none" opacity="0.8" />
        <circle cx="16" cy="45" r="1.5" fill="#D8B76A" opacity="0.9" />
        <path d="M12,98 A7,7 0 0,1 12,112" stroke="#D8B76A" strokeWidth="0.75" fill="none" opacity="0.8" />
        <circle cx="16" cy="105" r="1.5" fill="#D8B76A" opacity="0.9" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Royal Emerald Gold Frame.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes sparkleStar {
            0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
            50% { opacity: 1; transform: scale(1.1) rotate(90deg); filter: drop-shadow(0 0 5px #D8B76A); }
          }
        `}</style>
        <rect x="6" y="6" width="88" height="138" rx="8" fill="none" stroke="#D8B76A" strokeWidth="1.5" opacity="0.6" />
        <rect x="7.5" y="7.5" width="85" height="135" rx="6.5" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <path d="M6,20 Q16,16 20,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,20 Q84,16 80,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M6,130 Q16,134 20,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,130 Q84,134 80,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path style={{ animation: "sparkleStar 3s ease-in-out infinite", transformOrigin: "20px 20px" }} d="M20,16 L21,19 L24,20 L21,21 L20,24 L19,21 L16,20 L19,19 Z" fill="#D8B76A" />
        <path style={{ animation: "sparkleStar 3.5s ease-in-out infinite 1.2s", transformOrigin: "80px 20px" }} d="M80,16 L81,19 L84,20 L81,21 L80,24 L79,21 L76,20 L79,19 Z" fill="#D8B76A" />
        <path style={{ animation: "sparkleStar 4s ease-in-out infinite 0.5s", transformOrigin: "20px 130px" }} d="M20,126 L21,129 L24,130 L21,131 L20,134 L19,131 L16,130 L19,129 Z" fill="#D8B76A" />
        <path style={{ animation: "sparkleStar 3.2s ease-in-out infinite 1.8s", transformOrigin: "80px 130px" }} d="M80,126 L81,129 L84,130 L81,131 L80,134 L79,131 L76,130 L79,129 Z" fill="#D8B76A" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Blush Pink & Rose Gold Glitter.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes glitterFall {
            0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
            30% { opacity: 0.85; }
            70% { opacity: 0.85; }
            100% { transform: translateY(160px) translateX(10px); opacity: 0; }
          }
        `}</style>
        <circle cx="95" cy="15" r="4" fill="#E8B5AC" opacity="0.8" />
        <circle cx="88" cy="30" r="2.5" fill="#E8B5AC" opacity="0.6" />
        <circle cx="92" cy="48" r="3.5" fill="#E8B5AC" opacity="0.7" />
        <circle cx="84" cy="65" r="2" fill="#E8B5AC" opacity="0.5" />
        <circle cx="96" cy="85" r="4.5" fill="#E8B5AC" opacity="0.8" />
        <circle cx="89" cy="110" r="3" fill="#E8B5AC" opacity="0.6" />
        <circle cx="94" cy="135" r="4" fill="#E8B5AC" opacity="0.8" />
        <g style={{ animation: "glitterFall 10s linear infinite", transformOrigin: "center" }}>
          <circle cx="20" cy="10" r="1" fill="#E8B5AC" />
          <circle cx="45" cy="30" r="0.75" fill="#D8B76A" />
          <circle cx="75" cy="5" r="1.2" fill="#FFE5E9" />
          <path d="M85,25 L86,22 L89,21 L86,20 L85,17 L84,20 L81,21 L84,22 Z" fill="#E8B5AC" />
        </g>
        <g style={{ animation: "glitterFall 14s linear infinite 3s", transformOrigin: "center" }}>
          <circle cx="15" cy="40" r="1.2" fill="#D8B76A" />
          <circle cx="60" cy="15" r="0.8" fill="#FFE5E9" />
          <circle cx="80" cy="50" r="1" fill="#E8B5AC" />
          <path d="M30,55 L31,52 L34,51 L31,50 L30,47 L29,50 L26,51 L29,52 Z" fill="#E8B5AC" />
        </g>
        <g style={{ animation: "glitterFall 12s linear infinite 6s", transformOrigin: "center" }}>
          <circle cx="35" cy="25" r="0.8" fill="#E8B5AC" />
          <circle cx="70" cy="35" r="1.1" fill="#D8B76A" />
          <circle cx="90" cy="75" r="0.7" fill="#FFE5E9" />
          <path d="M55,100 L56,97 L59,96 L56,95 L55,92 L54,95 L51,96 L54,97 Z" fill="#E8B5AC" />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_5.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes leafDrift {
            0% { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0; }
            20% { opacity: 0.75; }
            80% { opacity: 0.75; }
            100% { transform: translateY(160px) translateX(-20px) rotate(180deg); opacity: 0; }
          }
        `}</style>
        <path d="M0,25 Q18,40 10,75 Q2,110 0,135" stroke="#7A8E7E" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        <path d="M9,32 C15,31 16,36 9,38 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M12,48 C18,49 16,54 12,53 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M11,68 C17,71 14,75 11,72 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M6,90 C12,94 9,98 6,95 Z" fill="#99AB9D" opacity="0.5" />
        <path d="M4,112 C10,115 8,119 4,116 Z" fill="#99AB9D" opacity="0.5" />
        <g style={{ animation: "leafDrift 12s linear infinite", transformOrigin: "center" }}>
          <path d="M45,20 C49,19 48,24 45,23 Z" fill="#99AB9D" opacity="0.7" />
          <path d="M75,50 C79,49 78,54 75,53 Z" fill="#99AB9D" opacity="0.6" />
        </g>
        <g style={{ animation: "leafDrift 16s linear infinite 4s", transformOrigin: "center" }}>
          <path d="M60,30 C64,29 63,34 60,33 Z" fill="#99AB9D" opacity="0.5" />
          <path d="M30,80 C34,79 33,84 30,83 Z" fill="#99AB9D" opacity="0.6" />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_6.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.35; transform: scale(0.85); }
            50% { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 2px #FFF); }
          }
          @keyframes shootingStar {
            0% { transform: translate(-30px, -30px); opacity: 0; }
            10% { opacity: 1; }
            20% { transform: translate(120px, 120px); opacity: 0; }
            100% { transform: translate(120px, 120px); opacity: 0; }
          }
        `}</style>
        <g stroke="#D8B76A" strokeWidth="0.75" opacity="0.75">
          <line x1="6" y1="0" x2="6" y2="150" />
          <line x1="8" y1="0" x2="8" y2="150" strokeWidth="0.25" opacity="0.5" />
          <path d="M6,5 Q2,10 6,15 M6,20 Q2,25 6,30 M6,35 Q2,40 6,45 M6,50 Q2,55 6,60 M6,65 Q2,70 6,75 M6,80 Q2,85 6,90 M6,95 Q2,100 6,105 M6,110 Q2,115 6,120 M6,125 Q2,130 6,135 M6,140 Q2,145 6,150" fill="none" />
          <path d="M6,7 Q9,12 6,17 M6,22 Q9,27 6,32 M6,37 Q9,42 6,47 M6,52 Q9,57 6,62 M6,67 Q9,72 6,77 M6,82 Q9,87 6,92 M6,97 Q9,102 6,107 M6,112 Q9,117 6,122 M6,127 Q9,132 6,137 M6,142 Q9,147 6,147" fill="none" opacity="0.5" />
        </g>
        <g stroke="#D8B76A" strokeWidth="0.75" opacity="0.75">
          <line x1="94" y1="0" x2="94" y2="150" />
          <line x1="92" y1="0" x2="92" y2="150" strokeWidth="0.25" opacity="0.5" />
          <path d="M94,5 Q98,10 94,15 M94,20 Q98,25 94,30 M94,35 Q98,40 94,45 M94,50 Q98,55 94,60 M94,65 Q98,70 94,75 M94,80 Q98,85 94,90 M94,95 Q98,100 94,105 M94,110 Q98,115 94,120 M94,125 Q98,130 94,135 M94,140 Q98,145 94,150" fill="none" />
          <path d="M94,7 Q91,12 94,17 M94,22 Q91,27 94,32 M94,37 Q91,42 94,47 M94,52 Q91,57 94,62 M94,67 Q91,72 94,77 M94,82 Q91,87 94,92 M94,97 Q91,102 94,107 M94,112 Q91,117 94,122 M94,127 Q91,132 94,137 M94,142 Q91,147 94,147" fill="none" opacity="0.5" />
        </g>
        <g style={{ animation: "twinkle 3s ease-in-out infinite" }}>
          <path d="M22,30 L23,28 L25,27 L23,26 L22,24 L21,26 L19,27 L21,28 Z" fill="#FFFFFF" />
          <path d="M25,110 L26,108 L28,107 L26,106 L25,104 L24,106 L22,107 L24,108 Z" fill="#FFFFFF" />
        </g>
        <g style={{ animation: "twinkle 4s ease-in-out infinite 1.5s" }}>
          <path d="M78,45 L79,43 L81,42 L79,41 L78,39 L77,41 L75,42 L77,43 Z" fill="#FFFFFF" />
          <path d="M75,115 L76,113 L78,112 L76,111 L75,109 L74,111 L72,112 L74,113 Z" fill="#FFFFFF" />
        </g>
        <g style={{ animation: "shootingStar 8s linear infinite 2s" }}>
          <line x1="0" y1="0" x2="-25" y2="-25" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        </g>
        <circle cx="30" cy="15" r="0.75" fill="#D8B76A" opacity="0.5" />
        <circle cx="50" cy="12" r="1" fill="#D8B76A" opacity="0.6" />
        <circle cx="70" cy="18" r="0.75" fill="#D8B76A" opacity="0.5" />
        <circle cx="40" cy="138" r="1" fill="#D8B76A" opacity="0.5" />
        <circle cx="60" cy="142" r="0.8" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_7.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <style>{`
          @keyframes charcoalGoldFloat {
            0%, 100% { transform: translateY(0px) scale(0.95); opacity: 0.4; }
            50% { transform: translateY(-8px) scale(1.05); opacity: 0.8; }
          }
        `}</style>
        <path d="M100,30 Q78,50 82,75 Q86,100 100,110" stroke="#D8B76A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <circle cx="85" cy="55" r="4" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }} />
        <circle cx="85" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="80" cy="80" r="5" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" style={{ animation: "charcoalGoldFloat 6s ease-in-out infinite 2s" }} />
        <circle cx="80" cy="80" r="2" fill="#D8B76A" opacity="0.5" />
        <path d="M78,48 Q70,42 76,38 Q82,34 84,42 Z" fill="#D8B76A" opacity="0.15" />
        <path d="M72,72 Q64,66 70,62 Q76,58 78,66 Z" fill="#D8B76A" opacity="0.15" />
        <circle cx="45" cy="40" r="0.8" fill="#D8B76A" style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }} />
        <circle cx="35" cy="90" r="1" fill="#D8B76A" style={{ animation: "charcoalGoldFloat 6s ease-in-out infinite 2s" }} />
        <circle cx="65" cy="115" r="0.6" fill="#D8B76A" style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }} />
      </svg>
    );
  }

  return null;
}

const InvitePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const downloadRef = useRef(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(0);

  // Premium state features
  const [showSpotifyPlayer, setShowSpotifyPlayer] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [audioReady, setAudioReady] = useState(false); // true once browser can start playing
  const [hiddenOverlay, setHiddenOverlay] = useState(false);
  const [mapSelectAddress, setMapSelectAddress] = useState(null);
  const [wishes, setWishes] = useState([]);
  const audioRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const pendingPlayRef = useRef(false); // tracks a play request made before audio was ready

  // Paystack & Gifting premium states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftGuestName, setGiftGuestName] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [loadingGiftPayment, setLoadingGiftPayment] = useState(false);

  // Declare variables unconditionally at the very top of the render scope 
  // to completely eliminate any Temporal Dead Zone (TDZ) reference errors.
  let musicUrl = "";
  let isDirectAudio = false;
  let galleryPhotos = [];
  const customTextSize = invitation?.userId?.customTextSize || 1.0;
  const customTextSizeTitle = invitation?.userId?.customTextSizeTitle || 1.0;
  const customTextSizeSubtitle = invitation?.userId?.customTextSizeSubtitle || 1.0;
  const customTextSizeCoupleNames = invitation?.userId?.customTextSizeCoupleNames || 1.0;
  const customTextSizeGreeting = invitation?.userId?.customTextSizeGreeting || 1.0;
  const customTextSizeMessage = invitation?.userId?.customTextSizeMessage || 1.0;
  const customTextSizeDetails = invitation?.userId?.customTextSizeDetails || 1.0;
  const customTextSizeReception = invitation?.userId?.customTextSizeReception || 1.0;
  const customTextSizeColors = invitation?.userId?.customTextSizeColors || 1.0;

  // Populate/re-assign variables once invitation details are asynchronously loaded.
  if (invitation?.userId) {
    musicUrl = invitation.userId.musicUrl || "";
    // Check if the couple has uploaded local device audio (stored in localStorage)
    // This only applies when viewing on the same device/browser where the audio was uploaded
    const ownerUserId = invitation.userId._id;
    if (ownerUserId) {
      try {
        const localAudio = localStorage.getItem(`vowlink_local_audio_url_${ownerUserId}`);
        if (localAudio && localAudio.startsWith("data:audio")) {
          musicUrl = localAudio;
        }
      } catch {}
    }
    // Map old placeholder SoundHelix loops to actual wedding instrumentals
    if (musicUrl && !musicUrl.startsWith("data:") && (musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" || musicUrl === "https://archive.org/download/PianoGuysMusic/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3")) {
      musicUrl = "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3";
    } else if (musicUrl && !musicUrl.startsWith("data:") && musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3") {
      musicUrl = "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3";
    } else if (musicUrl && !musicUrl.startsWith("data:") && (musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" || musicUrl === "https://archive.org/download/CantHelpFallingInLoveWYou/Cant%20Help%20Falling%20In%20Love%20W%20You.mp3")) {
      musicUrl = "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3";
    } else if (musicUrl && !musicUrl.startsWith("data:") && musicUrl === "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3") {
      musicUrl = "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3";
    } else if (musicUrl && !musicUrl.startsWith("data:") && (musicUrl === "https://archive.org/download/100ClassicalMusicMasterpieces/18%20Mendelssohn%20-%20Wedding%20March.mp3" || musicUrl === "https://archive.org/download/ClassicalMusicMidi/Mendelssohn_-_Wedding_March.mp3")) {
      // Remap any old Wedding March URL to the verified working source
      musicUrl = "https://archive.org/download/wedding-march/Wedding%20March.mp3";
    }
    isDirectAudio = musicUrl && !getSpotifyEmbedUrl(musicUrl);
    galleryPhotos = invitation.userId.galleryPhotos || [];
  }

  const countdown = useCountdown(invitation?.userId?.weddingDate);

  // Pre-load audio as soon as the music URL is known (invitation data arrives).
  // Creating the Audio object here — rather than waiting for a JSX <audio> to
  // mount — means buffering starts during the envelope screen, so by the time
  // the guest clicks "Open Card" the audio is already ready.
  useEffect(() => {
    if (!isDirectAudio || !musicUrl) return;

    const audio = new Audio();
    audio.src = musicUrl;
    audio.loop = true;
    audio.preload = "auto";

    audio.addEventListener("canplay", () => {
      setAudioReady(true);
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        audio.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Deferred playback failed", err));
      }
    });

    // Kick off buffering immediately
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      setAudioReady(false);
      setIsPlaying(false);
    };
  // Re-run only when the actual audio URL changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  // Pause background music when user switches tabs or minimizes browser, and resume when they return
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          wasPlayingRef.current = true;
        }
      } else {
        if (wasPlayingRef.current && audioRef.current && isOpen) {
          audioRef.current.play()
            .then(() => {
              wasPlayingRef.current = false;
            })
            .catch((err) => console.log("Failed to resume playback on tab return", err));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying, isOpen]);

  // Autoplay slideshow for the love story gallery
  useEffect(() => {
    if (galleryPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [galleryPhotos]);

  // Handle page scroll to show/hide the floating scroll down indicator
  // Pill persists until the user reaches the bottom of the page
  useEffect(() => {
    const handleScroll = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      if (distanceFromBottom < 80) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle dynamically scaling the invitation card to fit the viewport height
  useEffect(() => {
    if (!isOpen) return;

    // scaleLocked prevents address-bar-driven resize events (which fire constantly
    // on mobile as the user scrolls and the browser chrome collapses/expands)
    // from re-running the scale calculation after the initial stable measurement.
    let scaleLocked = false;

    const computeScale = () => {
      const card = cardRef.current;
      if (!card) return;

      const actualHeight = card.offsetHeight;
      setCardHeight(actualHeight);

      const viewportWidth = window.innerWidth;

      // Use visualViewport.height when available — it reflects the stable layout
      // viewport and does NOT change when the mobile browser address bar
      // collapses/expands during scroll, unlike window.innerHeight which causes
      // the jarring zoom-on-scroll glitch on iOS/Android.
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;

      // Card native design layout width is 608px (38rem)
      const nativeWidth = 608;

      // Compute scale needed to fit horizontally (allow 24px layout margins)
      const scaleX = (viewportWidth - 24) / nativeWidth;

      // Compute scale needed to fit vertically (allow 60px layout margins)
      const scaleY = (viewportHeight - 60) / actualHeight;

      let newScale;
      if (viewportWidth < 640) {
        // On mobile viewports, prioritize width so the card stays readable
        // and doesn't get squeezed into an ultra-thin column.
        newScale = scaleX;
      } else {
        // On larger screens (tablets/laptops), fit the most constrained dimension
        newScale = Math.min(scaleX, scaleY);
      }

      setScale(Math.min(1.25, newScale));
    };

    const handleResize = () => {
      // Ignore resize events triggered by mobile address-bar collapse/expand
      // after the scale has been locked in by the initial measurement cycle.
      if (scaleLocked) return;
      computeScale();
    };

    window.addEventListener("resize", handleResize);

    // Trigger at multiple intervals to handle slow font loading and image renders.
    // After the last timer fires we lock the scale so that subsequent mobile
    // address-bar resize events cannot trigger another jarring rescale.
    const timers = [
      setTimeout(computeScale, 100),
      setTimeout(computeScale, 300),
      setTimeout(computeScale, 800),
      setTimeout(() => { computeScale(); scaleLocked = true; }, 1500),
    ];

    return () => {
      window.removeEventListener("resize", handleResize);
      timers.forEach(clearTimeout);
    };
  }, [isOpen, invitation, customTextSize]);

  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v2/inline.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleGiftCheckout = async () => {
    if (!giftGuestName.trim() || !giftAmount || Number(giftAmount) < 100) {
      toast.warning("Please enter your name and a valid amount (minimum ₦100).");
      return;
    }

    setLoadingGiftPayment(true);
    const loaded = await loadPaystackScript();
    setLoadingGiftPayment(false);

    if (!loaded) {
      toast.error("Failed to load Paystack payment gateway. Please check your connection.");
      return;
    }

    const paystackCurrency = "NGN";
    const amountInMinor = Number(giftAmount) * 100;

    const paystackOptions = {
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_c3d7e8c28a21ae50bd22b5d448b1a80d0a00ed07",
      email: invitation.userId?.email || "guest@vowlink.com",
      amount: amountInMinor,
      currency: paystackCurrency,
      metadata: {
        paymentType: "registry_gift",
        coupleId: invitation.userId?._id,
        guestName: giftGuestName,
        message: giftMessage,
      },
      onSuccess: async (transaction) => {
        toast.info("Payment successful! Recording contribution...");
        try {
          const res = await api.post("/auth/registry/verify", {
            reference: transaction.reference,
            coupleId: invitation.userId?._id,
            guestName: giftGuestName,
            amount: Number(giftAmount),
            message: giftMessage,
          });
          setInvitation(prev => ({
            ...prev,
            userId: {
              ...prev.userId,
              honeymoonFundCurrent: res.data.couple.honeymoonFundCurrent
            }
          }));
          toast.success("Thank you for your generous contribution! 🎁❤️");
          setShowGiftModal(false);
          setGiftAmount("");
          setGiftMessage("");
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to verify contribution. Please contact the couple.");
        }
      },
      onCancel: () => {
        toast.info("Payment cancelled.");
      },
    };

    if (typeof window.PaystackPop === "function") {
      try {
        const paystack = new window.PaystackPop();
        paystack.newTransaction(paystackOptions);
        return;
      } catch (e) {
        console.warn("Paystack Pop V2 instantiation failed, falling back to V1 setup", e);
      }
    }

    if (window.PaystackPop && typeof window.PaystackPop.setup === "function") {
      const handler = window.PaystackPop.setup({
        ...paystackOptions,
        callback: paystackOptions.onSuccess,
        onClose: paystackOptions.onCancel
      });
      handler.openIframe();
    } else {
      toast.error("Paystack payment SDK is not initialized. Please refresh the page.");
    }
  };



  const handleOpenInvitation = () => {
    setIsOpen(true);
    window.scrollTo(0, 0); // Reset scroll to top to center card in viewport
    if (audioRef.current) {
      // Always call .play() synchronously within the gesture handler.
      // On iOS Safari this "registers" the play in the gesture context so
      // the browser will play as soon as the audio is ready, even if it hasn't
      // buffered yet. On desktop, Chrome/Firefox also queue the play internally.
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // play() rejected — audio may not be buffered yet on slow networks.
            // Set pendingPlayRef so onCanPlay can retry (desktop fallback only;
            // iOS would have already queued the play above).
            pendingPlayRef.current = true;
          });
      }
    } else {
      // Audio element not mounted yet — flag for deferred play
      pendingPlayRef.current = true;
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
        setGiftGuestName(res.data.guestName || "");
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true); // Treat server errors as not-found to prevent null crash
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
    if (!downloadRef.current) return;
    setDownloading(true);
    
    // Add is-exporting class to collapse heights of hidden elements
    downloadRef.current.classList.add("is-exporting");
    
    // Allow browser layout engine to recalculate and collapse heights
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(downloadRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        height: downloadRef.current.scrollHeight,
        style: {
          background: "radial-gradient(ellipse 120% 80% at 50% 0%, #0D1730 0%, #070A13 60%)",
        },
        filter: (node) => {
          if (node.id === "rsvp-open-btn" || node.id === "download-actions-bar") {
            return false;
          }
          if (node.classList && node.classList.contains("download-exclude")) {
            return false;
          }
          return true;
        }
      });
      const link = document.createElement("a");
      link.download = `invitation-${invitation.guestName?.toLowerCase().replace(/\s+/g, "-") || "card"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      // Remove class to restore full layout for the guest
      downloadRef.current.classList.remove("is-exporting");
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <section className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#070A13]">
        <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
          Loading your invitation...
        </p>
      </section>
    );

  if (notFound)
    return (
      <section className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#070A13] text-center px-6">
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
  const venueName = invitation.userId?.venueName || "";
  const receptionLocation = invitation.userId?.receptionLocation || "";
  const receptionName = invitation.userId?.receptionName || "";
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
  const customTextBoldness = invitation.userId?.customTextBoldness || "normal";
  const customTextAlign = invitation.userId?.customTextAlign || "center";
  const userHasCustomAlignment = invitation.userId?.userHasCustomAlignment || false;
  const userHasCustomTextColor = invitation.userId?.userHasCustomTextColor || false;

  const layout = getTemplateLayout(cardTheme, customCardBg);
  const textAlignment = userHasCustomAlignment ? (customTextAlign || "center") : (layout.align || "center");

  const baseWeight = customTextBoldness === "bold" ? "700" : (customTextBoldness === "medium" ? "500" : "400");
  const headingWeight = customTextBoldness === "bold" ? "950" : (customTextBoldness === "medium" ? "750" : "600");
  const couplePhotoUrl = invitation.userId?.couplePhotoUrl || "";
  const pageBgTemplate = invitation.userId?.pageBgTemplate || "";
  const coupleOverlayOpacity = invitation.userId?.coupleOverlayOpacity ?? 0.45;

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
      background: "url('/templates/elegant_gold_frame_with_navy_backdrop.png') center/cover no-repeat",
      color: customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#D8B76A",
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
    let bg = `url('${customCardBg}') center/cover no-repeat`;
    let color = "#1A2E4A";
    
    switch (customCardBg) {
      case "/templates/template_free_1.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#1A2E4A";
        break;
      case "/templates/Blush Pink Watercolor.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#3D2124";
        break;
      case "/templates/Cream Floral Elegance.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#6B5847";
        break;
      case "/templates/Emerald Eucalyptus Frame.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#E2E8F0";
        break;
      case "/templates/elegant_gold_frame_with_navy_backdrop.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#D8B76A";
        break;
      case "/templates/Royal Navy Lace Accent.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6";
        break;
      case "/templates/Elegant purple and silver floral.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#3C2A4D";
        break;
      case "/templates/template_plus_3.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6";
        break;
      case "/templates/Midnight Black Floral2.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6";
        break;
      case "/templates/Dark Black Gold Marble.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#D8B76A";
        break;
      case "/templates/Burgundy Velvet Filigree.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6";
        break;
      case "/templates/Royal Emerald Gold Frame.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#D8B76A";
        break;
      case "/templates/Blush Pink & Rose Gold Glitter.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#8C715A";
        break;
      case "/templates/template_pro_5.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#5C6B5E";
        break;
      case "/templates/template_pro_6.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#F5EBD6";
        break;
      case "/templates/template_pro_7.png":
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#D8B76A";
        break;
      default:
        color = customTextColor && customTextColor !== "#1A2E4A" ? customTextColor : "#1A2E4A";
    }
    cardStyles = {
      background: bg,
      color: color,
      fontFamily: activeFont,
    };
  }

  // Adjust theme color tags
  const primaryTextColor = cardStyles.color;
  const accentColor = cardTheme === "navy" || cardTheme === "forest" || cardTheme === "stardust" ? secHex : (isFreeUser ? "#B8963A" : priHex);

  const isFreeTemplate = layout.tier === "free";
  const isPlusTemplate = layout.tier === "plus";
  const isProTemplate = layout.tier === "pro";

  const scalePadding = (val) => {
    if (customTextSize > 1.0) {
      return Math.max(16, Math.round(val / customTextSize));
    }
    return val;
  };

  const customTextSizesObj = {
    global: customTextSize,
    title: customTextSizeTitle,
    subtitle: customTextSizeSubtitle,
    coupleNames: customTextSizeCoupleNames,
    greeting: customTextSizeGreeting,
    message: customTextSizeMessage,
    details: customTextSizeDetails,
    reception: customTextSizeReception,
    colors: customTextSizeColors,
  };

  const getBlockProps = (blockName, delay) => {
    const blockStyles = getBlockStyles(
      blockName,
      layout,
      customTextAlign,
      userHasCustomAlignment,
      "invite",
      customTextColor,
      primaryTextColor,
      userHasCustomTextColor,
      customTextSizesObj
    );
    
    let className = "";
    const style = { ...blockStyles };
    
    if (isPlusTemplate) {
      className = "animate-plus-fade-up";
    } else if (isProTemplate) {
      className = "animate-pro-text-reveal";
      style.animationDelay = delay;
    }
    
    return { className, style };
  };

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
    <div className={`min-h-screen min-h-[100dvh] relative ${isOpen ? "overflow-x-hidden" : "h-screen h-[100dvh] overflow-hidden"}`} style={{ background: "#070A13" }}>
      <style>{`
        .is-exporting .download-exclude,
        .is-exporting #rsvp-open-btn,
        .is-exporting #download-actions-bar {
          display: none !important;
        }
      `}</style>
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
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
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
      {/* Audio is managed programmatically via audioRef (see useEffect above) */}

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
            {/* Music buffering hint — only visible while audio is still loading */}
            {isDirectAudio && !audioReady && (
              <p className="mt-2 text-[9px] uppercase tracking-widest opacity-30 flex items-center gap-1" style={{ color: envelopeTextColor }}>
                <span className="inline-block animate-spin" style={{ animationDuration: "1.5s" }}>♪</span>
                Loading music…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scroll Down Floating Indicator (un-downloadable) */}
      {isOpen && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 select-none animate-bounce download-exclude bg-[#0D1220]/75 backdrop-blur-md border border-[#D8B76A]/30 px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          style={{
            color: "#D8B76A",
            opacity: showScrollIndicator ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.6s ease",
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8B76A]">
            Scroll down for details
          </span>
          <span className="text-xs font-bold animate-pulse text-[#D8B76A]">↓</span>
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
      <div ref={downloadRef} id="main-invitation-container" className="w-full relative z-10">
        {/* Section 1: Invitation Card centered vertically in viewport */}
        <section className="flex flex-col items-center justify-center py-0 px-4 relative z-10 w-full min-h-screen min-h-[100dvh]">
        {/* ═══ THE CARD (this gets downloaded) ═══ */}
        <div 
          className="w-full flex items-start justify-center relative"
          style={{ 
            height: cardHeight > 0 && isOpen && !downloading ? `${cardHeight * (downloading ? 1 : scale)}px` : "auto",
            transition: "height 0.3s ease-out"
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              transform: isOpen && !downloading ? `scale(${scale})` : "none",
              transformOrigin: "top center",
              transition: "transform 0.3s ease-out",
            }}
          >
            <div
              ref={cardRef}
              key={customCardBg || cardTheme}
              className={`w-[608px] flex-none rounded-2xl overflow-hidden transition-all duration-300 ${
                isPlusTemplate ? "animate-plus-fade-in shadow-2xl" : ""
              } ${
                isProTemplate ? "animate-pro-card-entrance animate-pro-border-glow shadow-[0_0_25px_rgba(216,183,106,0.15)]" : "shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
              }`}
            >
          {/* Card background container */}
          <div
            className="relative w-full overflow-hidden"
            style={cardStyles}
          >
            {isProTemplate && <div className="pro-card-shimmer-overlay" />}

            <div key={`${cardTheme}__${customCardBg}`} className={isProTemplate ? "animate-pro-float" : ""}>
              {renderThemeOrnaments(cardTheme, priHex, secHex, terHex, isFreeUser)}
              {cardTheme === "custom" && renderTemplateBackgroundGraphics(customCardBg, priHex, secHex, terHex, isFreeUser)}
            </div>
            {renderFrameBorder(layout.frameBorder)}
            {/* Custom Spacing & Scaling wrapper */}
            <div
              className={`relative z-10 flex flex-col justify-center w-full min-h-[620px] transition-all ${
                textAlignment === "left"
                  ? "items-start text-left"
                  : textAlignment === "right"
                  ? "items-end text-right"
                  : "items-center text-center"
              }`}
              style={{
                /* fontSize intentionally NOT set here — applied per-block via getBlockStyles */
                fontWeight: baseWeight,
                paddingTop: `calc(${layout.pt}px + ${customVerticalOffset}px)`,
                paddingBottom: `calc(${layout.pb}px - ${customVerticalOffset}px)`,
                paddingLeft: `${scalePadding(layout.pl)}px`,
                paddingRight: `${scalePadding(layout.pr)}px`,
                transform: `translateX(${customHorizontalOffset || 0}px)`,
                ...(layout?.contrastHelpers?.overlayBehindText ? {
                  background: layout.contrastHelpers.overlayBehindText === true
                    ? (layout.tier === "free" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)")
                    : layout.contrastHelpers.overlayBehindText,
                  borderRadius: "16px",
                  backdropFilter: "blur(4px)",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                  padding: "16px",
                  width: "90%",
                  margin: "0 auto",
                } : {})
              }}
            >
              {/* ── Wedding Invitation title ── */}
              <h2
                {...getBlockProps("title", "100ms")}
                style={{
                  ...getBlockProps("title", "100ms").style,
                  fontFamily: activeFont,
                  fontWeight: headingWeight,
                }}
              >
                Wedding Invitation
              </h2>

              {/* ornament divider */}
              <div {...getBlockProps("divider1", "300ms")} className={`${getBlockProps("divider1", "300ms").className} flex justify-center w-full`}>
                {renderOrnamentDivider(layout.dividerType, getBlockProps("divider1", "300ms").style.color, "my-3")}
              </div>

              {/* ── Marriage between ── */}
              <p
                {...getBlockProps("subtitle", "500ms")}
                style={{
                  ...getBlockProps("subtitle", "500ms").style,
                  ...script,
                  fontStyle: "italic",
                }}
              >
                Marriage between
              </p>

              {/* ── Couple names ── */}
              <h1
                {...getBlockProps("coupleNames", "700ms")}
                className={`${getBlockProps("coupleNames", "700ms").className} leading-tight`}
                style={{
                  ...getBlockProps("coupleNames", "700ms").style,
                  fontFamily: activeFont,
                  fontWeight: headingWeight,
                  backgroundImage: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "linear-gradient(135deg, #FFF 0%, #D8B76A 60%, #A37F28 100%)" : "none",
                  WebkitBackgroundClip: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "text" : "border-box",
                  WebkitTextFillColor: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "transparent" : "initial",
                  display: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "inline-block" : "block"
                }}
              >
                {invitation.userId?.partner1Name || "Partner 1"}{" "}
                <span style={{ 
                  color: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "#D8B76A" : getBlockProps("coupleNames", "700ms").style.color,
                  WebkitTextFillColor: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "#D8B76A" : "initial",
                  opacity: 0.9 
                }}>
                  and
                </span>{" "}
                {invitation.userId?.partner2Name || "Partner 2"}
              </h1>

              {/* ornament */}
              <div {...getBlockProps("divider2", "900ms")} className={`${getBlockProps("divider2", "900ms").className} flex justify-center w-full`}>
                {renderOrnamentDivider(layout.dividerType, getBlockProps("divider2", "900ms").style.color, "my-3", true)}
              </div>

              {/* ── You are cordially invited ── */}
              <p
                {...getBlockProps("greeting", "1100ms")}
                style={{
                  ...getBlockProps("greeting", "1100ms").style,
                }}
              >
                You are cordially invited
              </p>

              {/* ── Salutation (customized greeting) ── */}
              <p
                {...getBlockProps("greeting", "1100ms")}
                style={{
                  ...getBlockProps("greeting", "1100ms").style,
                  ...script,
                  fontStyle: "italic",
                }}
              >
                {invitation.greeting || `Dear ${invitation.guestName},`}
              </p>

              {/* ── Custom message ── */}
              <p
                {...getBlockProps("message", "1300ms")}
                className={`${getBlockProps("message", "1300ms").className} opacity-90`}
                style={{
                  ...getBlockProps("message", "1300ms").style,
                }}
              >
                {invitation.customMessage}
              </p>

              {/* ── Date ── */}
              {formattedDate && (
                <p
                  {...getBlockProps("details", "1500ms")}
                  style={{
                    ...getBlockProps("details", "1500ms").style,
                  }}
                >
                  Date : {formattedDate}
                </p>
              )}

              {/* ── Time ── */}
              <p
                {...getBlockProps("details", "1600ms")}
                style={{
                  ...getBlockProps("details", "1600ms").style,
                }}
              >
                Time : {formattedTimeWithFormat || "To be announced"}
              </p>

              {/* ── Venue (clickable → Maps Selector Modal) ── */}
              {venue && (
                isFreeUser ? (
                  <div
                    {...getBlockProps("details", "1700ms")}
                    className={`${getBlockProps("details", "1700ms").className} block w-full px-2`}
                    style={getBlockProps("details", "1700ms").style}
                  >
                    Location: {venueName || venue}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMapSelectAddress({ label: venueName || venue, query: venue });
                    }}
                    {...getBlockProps("details", "1700ms")}
                    style={{
                      ...getBlockProps("details", "1700ms").style,
                      textDecoration: "underline",
                      textDecorationColor: `${accentColor}55`,
                      textUnderlineOffset: "3px",
                    }}
                    className={`${getBlockProps("details", "1700ms").className} hover:opacity-80 transition block w-full px-2`}
                  >
                    Location: {venueName || venue}
                  </button>
                )
              )}

              {receptionLocation && (
                isFreeUser ? (
                  <div
                    {...getBlockProps("reception", "1800ms")}
                    className={`${getBlockProps("reception", "1800ms").className} block w-full px-2`}
                    style={getBlockProps("reception", "1800ms").style}
                  >
                    Reception at: {receptionName || receptionLocation}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMapSelectAddress({ label: receptionName || receptionLocation, query: receptionLocation });
                    }}
                    {...getBlockProps("reception", "1800ms")}
                    style={{
                      ...getBlockProps("reception", "1800ms").style,
                      textDecoration: "underline",
                      textDecorationColor: `${accentColor}55`,
                      textUnderlineOffset: "3px",
                    }}
                    className={`${getBlockProps("reception", "1800ms").className} hover:opacity-80 transition block w-full px-2`}
                  >
                    Reception at: {receptionName || receptionLocation}
                  </button>
                )
              )}

              {/* bottom ornament */}
              <div {...getBlockProps("divider2", "1900ms")} className={`${getBlockProps("divider2", "1900ms").className} flex justify-center w-full`}>
                {renderOrnamentDivider(layout.dividerType, primaryTextColor, "my-3", true)}
              </div>

              {/* Colors */}
              {weddingColors.length > 0 && (
                <div
                  {...getBlockProps("colors", "2000ms")}
                  style={{
                    ...getBlockProps("colors", "2000ms").style,
                  }}
                >
                  <p
                    style={{
                      color: getBlockProps("colors", "2000ms").style.color,
                      opacity: 0.8,
                      textShadow: getBlockProps("colors", "2000ms").style.textShadow || "none",
                    }}
                    className="uppercase mb-2 tracking-widest"
                  >
                    Colour of the Day
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {weddingColors.map((name, i) => {
                      const hex = WEDDING_COLORS.find((c) => c.name === name)?.hex || "#999";
                      const blockStyles = getBlockProps("colors", "2000ms").style;
                      const isDark = isDarkColor(hex);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.75 border text-[1.2em] font-extrabold shadow-xs whitespace-nowrap"
                          style={{
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : `${hex}44`,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${hex}11`,
                          }}
                        >
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-xs border ${isDark ? 'border-white/60' : 'border-white/20'}`} style={{ backgroundColor: hex }} />
                          <span style={{ color: blockStyles.color }}>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category badge */}
              <p
                {...getBlockProps("details", "2100ms")}
                style={{
                  ...getBlockProps("details", "2100ms").style,
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                }}
                className={`${getBlockProps("details", "2100ms").className} uppercase`}
              >
                {invitation.category || "Guest"}
              </p>
              
              {isFreeUser && (
                <div className="absolute bottom-2.5 left-0 right-0 text-center select-none pointer-events-none opacity-45 z-20">
                  <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: cardStyles.color || "#000000" }}>
                    Powered by VowLink
                  </span>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
      {/* ═══ END CARD ═══ */}
      </section>

      {/* Section 2: Details & RSVP actions below the card */}
      <section id="details-start-anchor" className="flex flex-col items-center justify-center py-10 px-4 gap-6 relative z-10 w-full download-exclude">

        {/* ── Countdown (outside card, not downloaded) ── */}
        {countdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
          <div className="w-full download-exclude" style={{ maxWidth: `${608 * scale}px` }}>
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
            className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 download-exclude ${
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
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-8 py-4 download-exclude">
            <p className="text-sm text-emerald-400">✓ We've received your RSVP. Thank you!</p>
          </div>
        ) : deadlinePassed ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-8 py-4 download-exclude">
            <p className="text-sm text-red-400">🔒 RSVP is now closed.</p>
          </div>
        ) : (
          <button
            id="rsvp-open-btn"
            onClick={() => setShowForm(true)}
            className={`rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.45)] download-exclude ${
              isProTemplate ? "animate-pro-btn-glow" : ""
            }`}
          >
            ✦ RSVP Now
          </button>
        )}

        {/* Download */}
        <div id="download-actions-bar" className="flex flex-wrap items-center justify-center gap-3 pb-4 download-exclude">
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
        </div>
      </section>
      <div id="details-start-anchor" className="scroll-mt-10" />

      {/* Love Story Couple Gallery Section (Plus/Pro) */}
      {galleryPhotos.length > 0 && (
        <section className="px-4 py-16 bg-[#090D19] border-t border-white/5 relative z-10 flex flex-col items-center download-exclude">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-2 text-center">Love Story</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 text-center">Our Gallery</h2>

          <div className="w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 bg-[#070A13] p-4 flex flex-col items-center">
            {/* Big slide */}
            <div className="w-full h-80 rounded-2xl overflow-hidden bg-white/5 relative">
              {galleryPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Couple photo ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    i === galleryIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                />
              ))}
              {/* Carousel controls — SVG chevron arrows */}
              <button
                onClick={() => setGalleryIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group z-20"
                aria-label="Previous photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/70 group-hover:text-[#D8B76A] transition-colors">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setGalleryIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group z-20"
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

      {/* Timeline / Schedule Section */}
      {invitation.userId?.timeline && invitation.userId.timeline.length > 0 && (
        <section className="px-4 sm:px-6 py-16 text-center bg-[#070A13] relative z-10 border-t border-white/5 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">Timeline</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">Wedding Schedule</h2>
          <p className="text-white/40 text-xs max-w-sm mb-12 -mt-4 leading-relaxed font-normal">
            Here is what to expect on our special day. We look forward to celebrating each moment with you!
          </p>

          <div className="relative w-full max-w-md mx-auto px-4">
            {/* The vertical line */}
            <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-linear-to-b from-[#D8B76A] via-[#F2D894]/50 to-[#D8B76A] opacity-30" />

            <div className="space-y-8 text-left">
              {invitation.userId.timeline.map((event, index) => {
                let displayTime = event.time;
                try {
                  const [hourStr, minStr] = event.time.split(":");
                  const hour = parseInt(hourStr);
                  const period = hour >= 12 ? "PM" : "AM";
                  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                  displayTime = `${displayHour}:${minStr} ${period}`;
                } catch (e) {
                  // Fallback
                }

                return (
                  <div key={index} className="relative flex items-start pl-14 group">
                    {/* Circle Node with icon/emoji */}
                    <div className="absolute left-3 top-0 h-10 w-10 rounded-full bg-[#0D1220] border border-[#D8B76A]/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(216,183,106,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(216,183,106,0.4)] group-hover:border-[#D8B76A] transition-all duration-300 z-10">
                      {event.icon}
                    </div>

                    {/* Timeline card details */}
                    <div className="flex-1 p-5 rounded-2xl border border-white/10 bg-[#0D1220] hover:border-[#D8B76A]/30 transition duration-300 shadow-md">
                      <span className="text-[10px] font-bold text-[#D8B76A] uppercase tracking-wider block mb-1">
                        {displayTime}
                      </span>
                      <h4 className="text-white text-base font-semibold font-serif mb-1">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-white/50 leading-relaxed font-normal">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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
              isFreeUser ? (
                <p className="text-white text-sm leading-6">{venueName || venue}</p>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMapSelectAddress({ label: venueName || venue, query: venue });
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
                  {venueName || venue}
                </button>
              )
            ) : (
              <p className="text-white text-sm leading-6">To be announced</p>
            )}
          </div>

          {receptionLocation && (
            <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
              <span className="text-2xl text-[#D8B76A]">🥂</span>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">Reception at</p>
              {isFreeUser ? (
                <p className="text-white text-sm leading-6">{receptionName || receptionLocation}</p>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMapSelectAddress({ label: receptionName || receptionLocation, query: receptionLocation });
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
                  {receptionName || receptionLocation}
                </button>
              )}
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
                  const isDark = isDarkColor(hex);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-sm"
                      style={{
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : `${hex}44`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${hex}11`,
                      }}
                    >
                      <div className={`h-5 w-5 rounded-full shrink-0 shadow-inner border ${isDark ? 'border-white/60' : 'border-white/20'}`} style={{ background: hex }} />
                      <span className="text-xs font-bold text-white tracking-wide">{name}</span>
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
        <section className="px-4 sm:px-6 py-16 text-center bg-[#090D19] relative z-10 border-t border-white/5 flex flex-col items-center download-exclude">
          <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">Gifting</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">Gift Registry</h2>
          
          <div className="w-full max-w-xl rounded-3xl border border-[#D8B76A]/30 bg-[#070A13]/90 p-6 sm:p-8 shadow-2xl space-y-8 text-left relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-9xl">🎁</div>
            
            {invitation.userId?.registryNotes && (
              <p className="text-sm text-white/70 text-center leading-relaxed italic border-b border-white/5 pb-6">
                "{invitation.userId.registryNotes}"
              </p>
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

            {/* Paystack Cash Gifting Option */}
            <div className="space-y-4 pt-4 border-t border-white/5 flex flex-col items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 w-full text-left">💳 Secure Online Gifting</h4>
              <p className="text-xs text-white/40 leading-relaxed w-full">
                You can send a cash gift instantly using your debit card or bank transfer via Paystack.
              </p>
              <button
                onClick={() => setShowGiftModal(true)}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3.5 text-xs font-bold uppercase tracking-widest text-[#070A13] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(216,183,106,0.35)]"
              >
                💝 Send Cash Gift
              </button>
            </div>
          </div>
        </section>
      )}
      </div>

      {/* GIFT REGISTRY MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D8B76A]/20 bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#1A2E4A]">Send Cash Gift</h2>
              <button
                onClick={() => setShowGiftModal(false)}
                className="text-[#1A2E4A]/40 hover:text-[#1A2E4A] transition text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Guest Name */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={giftGuestName}
                  onChange={(e) => setGiftGuestName(e.target.value)}
                  className="w-full rounded-xl border border-[#1A2E4A]/15 bg-[#F8F8F8] px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Gift Amount (₦) *</label>
                <input
                  type="number"
                  min="100"
                  placeholder="e.g. 5000"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#1A2E4A]/15 bg-[#F8F8F8] px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">Blessing / Message (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Send a warm wish to the couple..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full rounded-xl border border-[#1A2E4A]/15 bg-[#F8F8F8] px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition resize-none"
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleGiftCheckout}
                disabled={loadingGiftPayment}
                className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.4)] disabled:opacity-60 mt-2"
              >
                {loadingGiftPayment ? "Initializing gateway..." : "Proceed to Paystack"}
              </button>


            </div>
          </div>
        </div>
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
      {mapSelectAddress && (() => {
        const isObj = typeof mapSelectAddress === "object" && mapSelectAddress !== null;
        const displayLabel = isObj ? mapSelectAddress.label : mapSelectAddress;
        const mapsQuery = isObj ? mapSelectAddress.query : mapSelectAddress;
        return (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 shadow-2xl space-y-6 text-center">
              <div>
                <span className="text-3xl">🧭</span>
                <h3 className="font-serif text-xl text-white mt-2">Open in Maps</h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
                  Choose your preferred navigation app to open routes for:<br />
                  <span className="text-white/80 font-medium block mt-1 break-words">{displayLabel}</span>
                  {isObj && displayLabel !== mapsQuery && (
                    <span className="text-white/45 text-[10px] block mt-0.5 break-words italic">{mapsQuery}</span>
                  )}
                </p>
              </div>
              
              <div className="space-y-3">
                {/* Google Maps */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMapSelectAddress(null)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
                >
                  <span>🗺️</span> Google Maps
                </a>
                
                {/* Apple Maps */}
                <a
                  href={`https://maps.apple.com/?q=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMapSelectAddress(null)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-[#D8B76A]/40 transition flex items-center justify-center gap-2"
                >
                  <span>🍎</span> Apple Maps
                </a>
                
                {/* Waze */}
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(mapsQuery)}`}
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
        );
      })()}
    </div>
  );
};

export default InvitePage;
