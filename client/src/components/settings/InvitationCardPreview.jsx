import React, { useEffect, useState, useRef } from "react";
import { WEDDING_COLORS } from "../ColorPicker";
import { useSettings } from "../../context/SettingsContext";
import { getTemplateLayout } from "../../utils/templateLayouts";

export const renderThemeOrnaments = (theme, pri, sec, ter, isFreeUser) => {
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

  if (customCardBg === "/templates/template_free_2.png") {
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

  if (customCardBg === "/templates/template_free_3.png") {
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

  if (customCardBg === "/templates/template_plus_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="140" rx="6" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <path d="M6,6 Q20,8 15,22 Q12,30 6,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
        <circle cx="18" cy="8" r="2" fill="#A3B899" />
        <path d="M94,6 Q80,8 85,22 Q88,30 94,35" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="88" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
        <circle cx="82" cy="8" r="2" fill="#A3B899" />
        <path d="M6,144 Q20,142 15,128 Q12,120 6,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
        <circle cx="18" cy="142" r="2" fill="#A3B899" />
        <path d="M94,144 Q80,142 85,128 Q88,120 94,115" stroke="#A3B899" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        <circle cx="88" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
        <circle cx="82" cy="142" r="2" fill="#A3B899" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_plus_2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <line x1="10" y1="0" x2="10" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.4" />
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.2" />
        <path d="M10,10 Q6,15 10,20 M10,30 Q6,35 10,40 M10,50 Q6,55 10,60 M10,70 Q6,75 10,80 M10,90 Q6,95 10,100 M10,110 Q6,115 10,120 M10,130 Q6,135 10,140" stroke="#D8B76A" strokeWidth="0.5" opacity="0.5" />
        <path d="M0,0 Q18,0 18,18 Q0,18 0,0 Z" fill="#D8B76A" opacity="0.15" />
        <path d="M0,150 Q18,150 18,132 Q0,132 0,150 Z" fill="#D8B76A" opacity="0.15" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_1.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <path d="M100,5 Q70,40 85,75 Q100,110 80,145" stroke="#D8B76A" strokeWidth="0.8" opacity="0.7" />
        <path d="M100,35 Q85,55 92,80 Q99,105 100,120" stroke="#D8B76A" strokeWidth="0.4" opacity="0.5" />
        <path d="M100,70 Q90,95 93,115 Q96,135 100,140" stroke="#D8B76A" strokeWidth="0.5" opacity="0.6" />
        <circle cx="88" cy="20" r="1" fill="#D8B76A" opacity="0.4" />
        <circle cx="94" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="82" cy="95" r="0.75" fill="#D8B76A" opacity="0.3" />
        <circle cx="91" cy="130" r="1.2" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_2.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        {/* Decorative corner quadrants (top-left & bottom-left) matching the velvet burgundy look */}
        <path d="M0,15 A15,15 0 0,0 15,0 L0,0 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,15 A15,15 0 0,0 15,0" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,12 A12,12 0 0,0 12,0" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />
        
        <path d="M0,135 A15,15 0 0,1 15,150 L0,150 Z" fill="#3D0C1A" opacity="0.9" />
        <path d="M0,135 A15,15 0 0,1 15,150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        <path d="M0,138 A12,12 0 0,1 12,150" stroke="#D8B76A" strokeWidth="0.25" opacity="0.5" />

        {/* Straight gold vertical border line on the left side */}
        <line x1="12" y1="0" x2="12" y2="150" stroke="#D8B76A" strokeWidth="0.75" opacity="0.8" />
        
        {/* Three semi-circular loops curving to the right */}
        {/* Loop 1: centered at y=45 */}
        <path d="M12,38 A7,7 0 0,1 12,52" stroke="#D8B76A" strokeWidth="0.75" fill="none" opacity="0.8" />
        <circle cx="16" cy="45" r="1.5" fill="#D8B76A" opacity="0.9" />
        
        {/* Loop 2: centered at y=75 */}
        <path d="M12,68 A7,7 0 0,1 12,82" stroke="#D8B76A" strokeWidth="0.75" fill="none" opacity="0.8" />
        <circle cx="16" cy="75" r="1.5" fill="#D8B76A" opacity="0.9" />
        
        {/* Loop 3: centered at y=105 */}
        <path d="M12,98 A7,7 0 0,1 12,112" stroke="#D8B76A" strokeWidth="0.75" fill="none" opacity="0.8" />
        <circle cx="16" cy="105" r="1.5" fill="#D8B76A" opacity="0.9" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_3.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <rect x="6" y="6" width="88" height="138" rx="8" fill="none" stroke="#D8B76A" strokeWidth="1.5" opacity="0.6" />
        <rect x="7.5" y="7.5" width="85" height="135" rx="6.5" fill="none" stroke="#D8B76A" strokeWidth="0.5" opacity="0.3" />
        <path d="M6,20 Q16,16 20,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,20 Q84,16 80,6" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M6,130 Q16,134 20,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M94,130 Q84,134 80,144" stroke="#D8B76A" strokeWidth="1" fill="none" opacity="0.7" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_4.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        <circle cx="95" cy="15" r="4" fill="#E8B5AC" opacity="0.8" />
        <circle cx="88" cy="30" r="2.5" fill="#E8B5AC" opacity="0.6" />
        <circle cx="92" cy="48" r="3.5" fill="#E8B5AC" opacity="0.7" />
        <circle cx="84" cy="65" r="2" fill="#E8B5AC" opacity="0.5" />
        <circle cx="96" cy="85" r="4.5" fill="#E8B5AC" opacity="0.8" />
        <circle cx="89" cy="110" r="3" fill="#E8B5AC" opacity="0.6" />
        <circle cx="94" cy="135" r="4" fill="#E8B5AC" opacity="0.8" />
        <path d="M85,25 L86,22 L89,21 L86,20 L85,17 L84,20 L81,21 L84,22 Z" fill="#E8B5AC" opacity="0.9" />
        <path d="M90,75 L91,72 L94,71 L91,70 L90,67 L89,70 L86,71 L89,72 Z" fill="#E8B5AC" opacity="0.9" />
        <path d="M83,120 L84,117 L87,116 L84,115 L83,112 L82,115 L79,116 L82,117 Z" fill="#E8B5AC" opacity="0.8" />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_5.png") {
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

  if (customCardBg === "/templates/template_pro_6.png") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 150" fill="none" preserveAspectRatio="none">
        {/* Left Side Gold Column Border */}
        <g stroke="#D8B76A" strokeWidth="0.75" opacity="0.75">
          <line x1="6" y1="0" x2="6" y2="150" />
          <line x1="8" y1="0" x2="8" y2="150" strokeWidth="0.25" opacity="0.5" />
          <path d="M6,5 Q2,10 6,15 M6,20 Q2,25 6,30 M6,35 Q2,40 6,45 M6,50 Q2,55 6,60 M6,65 Q2,70 6,75 M6,80 Q2,85 6,90 M6,95 Q2,100 6,105 M6,110 Q2,115 6,120 M6,125 Q2,130 6,135 M6,140 Q2,145 6,150" fill="none" />
          <path d="M6,7 Q9,12 6,17 M6,22 Q9,27 6,32 M6,37 Q9,42 6,47 M6,52 Q9,57 6,62 M6,67 Q9,72 6,77 M6,82 Q9,87 6,92 M6,97 Q9,102 6,107 M6,112 Q9,117 6,122 M6,127 Q9,132 6,137 M6,142 Q9,147 6,147" fill="none" opacity="0.5" />
        </g>

        {/* Right Side Gold Column Border */}
        <g stroke="#D8B76A" strokeWidth="0.75" opacity="0.75">
          <line x1="94" y1="0" x2="94" y2="150" />
          <line x1="92" y1="0" x2="92" y2="150" strokeWidth="0.25" opacity="0.5" />
          <path d="M94,5 Q98,10 94,15 M94,20 Q98,25 94,30 M94,35 Q98,40 94,45 M94,50 Q98,55 94,60 M94,65 Q98,70 94,75 M94,80 Q98,85 94,90 M94,95 Q98,100 94,105 M94,110 Q98,115 94,120 M94,125 Q98,130 94,135 M94,140 Q98,145 94,150" fill="none" />
          <path d="M94,7 Q91,12 94,17 M94,22 Q91,27 94,32 M94,37 Q91,42 94,47 M94,52 Q91,57 94,62 M94,67 Q91,72 94,77 M94,82 Q91,87 94,92 M94,97 Q91,102 94,107 M94,112 Q91,117 94,122 M94,127 Q91,132 94,137 M94,142 Q91,147 94,147" fill="none" opacity="0.5" />
        </g>
        
        {/* Twinkling stars in the middle */}
        <path d="M22,30 L23,28 L25,27 L23,26 L22,24 L21,26 L19,27 L21,28 Z" fill="#FFFFFF" opacity="0.85" />
        <path d="M78,45 L79,43 L81,42 L79,41 L78,39 L77,41 L75,42 L77,43 Z" fill="#FFFFFF" opacity="0.85" />
        <path d="M25,110 L26,108 L28,107 L26,106 L25,104 L24,106 L22,107 L24,108 Z" fill="#FFFFFF" opacity="0.8" />
        <path d="M75,115 L76,113 L78,112 L76,111 L75,109 L74,111 L72,112 L74,113 Z" fill="#FFFFFF" opacity="0.8" />
        {/* Scattered gold dust */}
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
        <path d="M100,30 Q78,50 82,75 Q86,100 100,110" stroke="#D8B76A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <circle cx="85" cy="55" r="4" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" />
        <circle cx="85" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="80" cy="80" r="5" stroke="#D8B76A" strokeWidth="0.6" fill="none" opacity="0.6" />
        <circle cx="80" cy="80" r="2" fill="#D8B76A" opacity="0.5" />
        <path d="M78,48 Q70,42 76,38 Q82,34 84,42 Z" fill="#D8B76A" opacity="0.15" />
        <path d="M72,72 Q64,66 70,62 Q76,58 78,66 Z" fill="#D8B76A" opacity="0.15" />
      </svg>
    );
  }

  return null;
};

const InvitationCardPreview = () => {
  const {
    couplePhotoUrl,
    coupleOverlayOpacity,
    cardStyles,
    cardTheme,
    priHex,
    secHex,
    terHex,
    isFreeUser,
    customTextAlign,
    customTextSize,
    customTextBoldness,
    customVerticalOffset,
    customHorizontalOffset,
    activeFont,
    primaryTextColor,
    p1,
    p2,
    formattedDate,
    formattedTime,
    venue,
    venueName,
    receptionLocation,
    receptionName,
    weddingColors,
    isPro,
    customCardBg,
    customBgInputRef,
    setCardTheme,
  } = useSettings();

  const layout = getTemplateLayout(cardTheme, customCardBg);
  const textAlignment = customTextAlign || layout.align;

  const baseWeight = customTextBoldness === "bold" ? "700" : (customTextBoldness === "medium" ? "500" : "400");
  const headingWeight = customTextBoldness === "bold" ? "950" : (customTextBoldness === "medium" ? "750" : "600");

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const shouldHideBg = containerWidth > 0 && containerWidth < 380;

  const previewContainerClass = shouldHideBg
    ? "w-full bg-transparent rounded-none overflow-hidden shadow-none border-none p-0 relative flex items-center justify-center min-h-0"
    : "w-full bg-[#070A13] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 p-4 sm:p-6 relative flex items-center justify-center min-h-[580px]";

  return (
    <div className="col-span-12 lg:col-span-6 lg:sticky lg:top-8 space-y-4 animate-fade-in">
      <p className="text-xs uppercase tracking-[0.25em] text-[#D8B76A] font-bold">Live Invitation Card Preview</p>

      <div 
        ref={containerRef}
        id="live-card-preview"
        className={previewContainerClass}
      >
        {/* Page Background (Couple Photo) */}
        {!shouldHideBg && couplePhotoUrl ? (
          <>
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 animate-fade-in hidden md:block lg:hidden"
              style={{ backgroundImage: `url(${couplePhotoUrl})` }}
            />
            <div 
              className="absolute inset-0 z-0 transition-all duration-300 hidden md:block lg:hidden"
              style={{ backgroundColor: `rgba(0, 0, 0, ${coupleOverlayOpacity})` }}
            />
          </>
        ) : !shouldHideBg ? (
          /* Gold shimmer / dark gradient fallback background */
          <div 
            className="absolute inset-0 z-0 opacity-40 hidden md:block lg:hidden" 
            style={{ background: "radial-gradient(circle at 50% 30%, #1A2E4A 0%, #070A13 80%)" }}
          />
        ) : null}

        {/* The Invitation Card */}
        <div
          className="relative z-10 w-full max-w-[28rem] sm:max-w-[32rem] overflow-hidden rounded-xl shadow-2xl border border-white/5"
          style={cardStyles}
        >
          {renderThemeOrnaments(cardTheme, priHex, secHex, terHex, isFreeUser)}
          {renderTemplateBackgroundGraphics(customCardBg, priHex, secHex, terHex, isFreeUser)}
          {renderFrameBorder(layout.frameBorder)}

          <div
            className={`relative z-10 flex flex-col justify-center w-full min-h-[580px] transition-all ${
              textAlignment === "left"
                ? "items-start text-left"
                : textAlignment === "right"
                ? "items-end text-right"
                : "items-center text-center"
            }`}
            style={{
              fontSize: `${customTextSize}em`,
              fontWeight: baseWeight,
              paddingTop: `calc(${layout.pt}px + ${customVerticalOffset}px)`,
              paddingBottom: `calc(${layout.pb}px - ${customVerticalOffset}px)`,
              paddingLeft: `${layout.pl}px`,
              paddingRight: `${layout.pr}px`,
              transform: `translateX(${customHorizontalOffset || 0}px)`,
            }}
          >
            <h2 className="mt-2" style={{ fontFamily: activeFont, color: primaryTextColor, fontSize: "1.25em", fontWeight: headingWeight, textShadow: layout.textShadow || "none" }}>
              Wedding Invitation
            </h2>

            {renderOrnamentDivider(layout.dividerType, primaryTextColor, "my-3")}

            <p className="italic mb-1" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
              Marriage between
            </p>

            <h1 className="my-1 leading-tight" style={{ 
              fontFamily: activeFont, 
              color: primaryTextColor, 
              fontSize: "1.8em", 
              fontWeight: headingWeight, 
              textShadow: layout.textShadow || "none",
              backgroundImage: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "linear-gradient(135deg, #FFF 0%, #D8B76A 60%, #A37F28 100%)" : "none",
              WebkitBackgroundClip: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "text" : "border-box",
              WebkitTextFillColor: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "transparent" : "initial",
              display: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "inline-block" : "block"
            }}>
              {p1 || "Partner 1"}{" "}
              <span style={{ 
                color: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "#D8B76A" : primaryTextColor,
                WebkitTextFillColor: (layout.dividerType?.includes("gold") || layout.dividerType === "glitter" || cardTheme === "navy") ? "#D8B76A" : "initial",
                opacity: 0.9 
              }}>
                and
              </span>{" "}
              {p2 || "Partner 2"}
            </h1>

            {renderOrnamentDivider(layout.dividerType, primaryTextColor, "my-3", true)}

            <p className="mb-3" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
              Dear Guest Name,
            </p>

            <p className="mb-4 max-w-[240px] leading-relaxed opacity-90" style={{ color: primaryTextColor, fontSize: "0.7em", textShadow: layout.textShadow || "none" }}>
              We request the honor of your presence as we celebrate our love and write a new chapter of our lives together.
            </p>

            {formattedDate && (
              <p className="mb-1" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
                Date: {formattedDate}
              </p>
            )}

            {formattedTime && (
              <p className="mb-1" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
                Time: {formattedTime}
              </p>
            )}

            {venue && (
              <p className="mb-1 max-w-[240px] break-words whitespace-normal px-2" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
                Location: {venueName || venue}
              </p>
            )}

            {receptionLocation && (
              <p className="mb-3 max-w-[240px] break-words whitespace-normal px-2" style={{ color: primaryTextColor, fontSize: "0.75em", textShadow: layout.textShadow || "none" }}>
                Reception: {receptionName || receptionLocation}
              </p>
            )}

            {weddingColors.length > 0 && (
              <div className="mt-3">
                <p className="uppercase tracking-widest mb-2" style={{ color: primaryTextColor, opacity: 0.8, fontSize: "0.55em", textShadow: layout.textShadow || "none" }}>
                  Colour of the Day
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {weddingColors.map((name, i) => {
                    const hex = WEDDING_COLORS.find(c => c.name === name)?.hex || "#999";
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 border text-[0.45em] font-bold shadow-xs whitespace-nowrap"
                        style={{
                          borderColor: `${hex}44`,
                          backgroundColor: `${hex}11`,
                        }}
                      >
                        <div className="h-2 w-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: hex }} />
                        <span style={{ color: primaryTextColor }}>{name}</span>
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
  );
};

export default InvitationCardPreview;
