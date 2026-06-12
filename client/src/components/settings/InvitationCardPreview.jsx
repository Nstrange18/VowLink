import React, { useEffect, useState, useRef } from "react";
import { WEDDING_COLORS } from "../ColorPicker";
import { useSettings } from "../../context/SettingsContext";

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

          <div
            className={`relative z-10 px-6 pt-14 pb-16 flex flex-col justify-center w-full min-h-[580px] transition-all ${
              customTextAlign === "left"
                ? "items-start text-left"
                : customTextAlign === "right"
                ? "items-end text-right"
                : "items-center text-center"
            }`}
            style={{
              fontSize: `${customTextSize}em`,
              fontWeight: baseWeight,
              paddingTop: `calc(5rem + ${customVerticalOffset}px)`,
              paddingBottom: `calc(5.5rem - ${customVerticalOffset}px)`,
              transform: `translateX(${customHorizontalOffset || 0}px)`,
            }}
          >
            <h2 className="mt-2" style={{ fontFamily: activeFont, color: primaryTextColor, fontSize: "1.25em", fontWeight: headingWeight }}>
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

            <h1 className="my-1 leading-tight" style={{ fontFamily: activeFont, color: primaryTextColor, fontSize: "1.8em", fontWeight: headingWeight }}>
              {p1 || "Partner 1"} <span style={{ color: primaryTextColor, opacity: 0.9 }}>and</span> {p2 || "Partner 2"}
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

            {formattedTime && (
              <p className="mb-1" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                Time: {formattedTime}
              </p>
            )}

            {venue && (
              <p className="mb-1 max-w-[240px] break-words whitespace-normal px-2" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                Location: {venueName || venue}
              </p>
            )}

            {receptionLocation && (
              <p className="mb-3 max-w-[240px] break-words whitespace-normal px-2" style={{ color: primaryTextColor, fontSize: "0.75em" }}>
                Reception: {receptionName || receptionLocation}
              </p>
            )}

            {weddingColors.length > 0 && (
              <div className="mt-3">
                <p className="uppercase tracking-widest mb-2" style={{ color: primaryTextColor, opacity: 0.8, fontSize: "0.55em" }}>
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
