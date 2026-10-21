const TemplateBackgroundGraphics = ({ customCardBg }) => {
  if (!customCardBg) return null;

  if (customCardBg === "/templates/Blush Pink Watercolor.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <circle
          cx="85"
          cy="115"
          r="30"
          fill="#FFE5E9"
          opacity="0.6"
          filter="blur(10px)"
        />
        <circle
          cx="95"
          cy="50"
          r="25"
          fill="#FFF0F2"
          opacity="0.8"
          filter="blur(8px)"
        />
        <path
          d="M100,20 Q80,40 85,60 Q90,80 100,90"
          stroke="#C3A38A"
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M100,50 Q75,70 80,95 Q85,120 100,130"
          stroke="#C3A38A"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <circle cx="82" cy="55" r="5" fill="#F4B2B9" opacity="0.9" />
        <circle cx="78" cy="85" r="6" fill="#F4B2B9" opacity="0.95" />
        <circle cx="81" cy="110" r="5.5" fill="#F4B2B9" opacity="0.9" />
        <path d="M78,51 C73,48 70,52 78,55" fill="#B2C8B2" opacity="0.8" />
        <path d="M72,83 C67,80 64,84 72,87" fill="#B2C8B2" opacity="0.8" />
        <path d="M84,89 C82,94 86,96 84,89" fill="#B2C8B2" opacity="0.8" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Cream Floral Elegance.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <circle
          cx="15"
          cy="35"
          r="35"
          fill="#F4ECE1"
          opacity="0.7"
          filter="blur(12px)"
        />
        <circle
          cx="10"
          cy="100"
          r="30"
          fill="#EFE5D8"
          opacity="0.6"
          filter="blur(10px)"
        />
        <path
          d="M0,15 Q25,35 20,60 Q15,85 0,110"
          stroke="#A89276"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M0,50 Q18,75 15,100 Q12,125 0,140"
          stroke="#A89276"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
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

  if (customCardBg === "/templates/template_free_1.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes floatGoldDust1 {
            0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0.2; }
            50% { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.6; }
            100% { transform: translateY(-16px) translateX(0px) scale(0.8); opacity: 0.2; }
          }
        `}</style>
        {/* Soft floating gold dust particles that overlay on top of the cream background */}
        <circle
          cx="15"
          cy="35"
          r="0.7"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }}
        />
        <circle
          cx="25"
          cy="115"
          r="0.5"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }}
        />
        <circle
          cx="80"
          cy="45"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 7s ease-in-out infinite 4s" }}
        />
        <circle
          cx="75"
          cy="105"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }}
        />
        <circle
          cx="45"
          cy="20"
          r="0.5"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }}
        />
        <circle
          cx="55"
          cy="130"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 7s ease-in-out infinite 4s" }}
        />
        <circle
          cx="90"
          cy="85"
          r="0.5"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 6s ease-in-out infinite" }}
        />
        <circle
          cx="12"
          cy="80"
          r="0.7"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust1 8s ease-in-out infinite 2s" }}
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/Emerald Eucalyptus Frame.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes rustlePlusLeaves {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(1.5deg) scale(1.02); }
          }
        `}</style>
        <rect
          x="5"
          y="5"
          width="90"
          height="140"
          rx="6"
          fill="none"
          stroke="#D8B76A"
          strokeWidth="0.5"
          opacity="0.3"
        />
        <g
          style={{
            animation: "rustlePlusLeaves 5s ease-in-out infinite",
            transformOrigin: "center",
          }}
        >
          <path
            d="M6,6 Q20,8 15,22 Q12,30 6,35"
            stroke="#A3B899"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="12" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M14,15 C10,13 10,20 14,21 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="18" cy="8" r="2" fill="#A3B899" />
        </g>
        <g
          style={{
            animation: "rustlePlusLeaves 6s ease-in-out infinite 1.5s",
            transformOrigin: "center",
          }}
        >
          <path
            d="M94,6 Q80,8 85,22 Q88,30 94,35"
            stroke="#A3B899"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="88" cy="12" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path d="M86,15 C90,13 90,20 86,21 Z" fill="#7D9B76" opacity="0.7" />
          <circle cx="82" cy="8" r="2" fill="#A3B899" />
        </g>
        <g
          style={{
            animation: "rustlePlusLeaves 6s ease-in-out infinite 1.5s",
            transformOrigin: "center",
          }}
        >
          <path
            d="M6,144 Q20,142 15,128 Q12,120 6,115"
            stroke="#A3B899"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="12" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path
            d="M14,135 C10,137 10,130 14,129 Z"
            fill="#7D9B76"
            opacity="0.7"
          />
          <circle cx="18" cy="142" r="2" fill="#A3B899" />
        </g>
        <g
          style={{
            animation: "rustlePlusLeaves 5s ease-in-out infinite",
            transformOrigin: "center",
          }}
        >
          <path
            d="M94,144 Q80,142 85,128 Q88,120 94,115"
            stroke="#A3B899"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="88" cy="138" r="2.5" fill="#D8B76A" opacity="0.9" />
          <path
            d="M86,135 C90,137 90,130 86,129 Z"
            fill="#7D9B76"
            opacity="0.7"
          />
          <circle cx="82" cy="142" r="2" fill="#A3B899" />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/Royal Navy Lace Accent.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes laceGlow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="150"
          stroke="#D8B76A"
          strokeWidth="0.75"
          style={{ animation: "laceGlow 4s ease-in-out infinite" }}
        />
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="150"
          stroke="#D8B76A"
          strokeWidth="0.25"
          opacity="0.2"
        />
        <path
          d="M10,10 Q6,15 10,20 M10,30 Q6,35 10,40 M10,50 Q6,55 10,60 M10,70 Q6,75 10,80 M10,90 Q6,95 10,100 M10,110 Q6,115 10,120 M10,130 Q6,135 10,140"
          stroke="#D8B76A"
          strokeWidth="0.5"
          style={{ animation: "laceGlow 4s ease-in-out infinite" }}
        />
        <path d="M0,0 Q18,0 18,18 Q0,18 0,0 Z" fill="#D8B76A" opacity="0.12" />
        <path
          d="M0,150 Q18,150 18,132 Q0,132 0,150 Z"
          fill="#D8B76A"
          opacity="0.12"
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/Elegant purple and silver floral.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes floatSilverDust {
            0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0.15; }
            50% { transform: translateY(-10px) translateX(5px) scale(1.25); opacity: 0.6; }
            100% { transform: translateY(-20px) translateX(0px) scale(0.8); opacity: 0.15; }
          }
        `}</style>
        <circle
          cx="15"
          cy="35"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "floatSilverDust 7s ease-in-out infinite" }}
          opacity="0.3"
        />
        <circle
          cx="25"
          cy="115"
          r="0.6"
          fill="#9F86C0"
          style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }}
        />
        <circle
          cx="80"
          cy="45"
          r="0.7"
          fill="#E0AAFF"
          style={{ animation: "floatSilverDust 8s ease-in-out infinite 5s" }}
        />
        <circle
          cx="75"
          cy="105"
          r="0.9"
          fill="#D8B76A"
          style={{ animation: "floatSilverDust 7s ease-in-out infinite" }}
          opacity="0.3"
        />
        <circle
          cx="45"
          cy="20"
          r="0.6"
          fill="#E0AAFF"
          style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }}
        />
        <circle
          cx="55"
          cy="130"
          r="0.7"
          fill="#9F86C0"
          style={{ animation: "floatSilverDust 8s ease-in-out infinite 5s" }}
        />
        <circle
          cx="90"
          cy="85"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "floatSilverDust 7s ease-in-out infinite" }}
          opacity="0.2"
        />
        <circle
          cx="12"
          cy="80"
          r="0.8"
          fill="#E0AAFF"
          style={{ animation: "floatSilverDust 9s ease-in-out infinite 2.5s" }}
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/template_plus_3.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes floatGoldDust2 {
            0% { transform: translateY(0px) translateX(0px) scale(0.7); opacity: 0.15; }
            50% { transform: translateY(-12px) translateX(6px) scale(1.3); opacity: 0.7; }
            100% { transform: translateY(-24px) translateX(0px) scale(0.7); opacity: 0.15; }
          }
        `}</style>
        <circle
          cx="20"
          cy="40"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 5s ease-in-out infinite" }}
        />
        <circle
          cx="30"
          cy="110"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 7s ease-in-out infinite 1.5s" }}
        />
        <circle
          cx="75"
          cy="50"
          r="0.7"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 6s ease-in-out infinite 3s" }}
        />
        <circle
          cx="80"
          cy="100"
          r="0.9"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 8s ease-in-out infinite 4.5s" }}
        />
        <circle
          cx="40"
          cy="30"
          r="0.5"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 7s ease-in-out infinite 1.5s" }}
        />
        <circle
          cx="60"
          cy="120"
          r="0.7"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 5s ease-in-out infinite" }}
        />
        <circle
          cx="85"
          cy="80"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 6s ease-in-out infinite 3s" }}
        />
        <circle
          cx="15"
          cy="70"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust2 8s ease-in-out infinite 4.5s" }}
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/Midnight Black Floral2.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes floatGoldDust3 {
            0% { transform: translateY(0px) translateX(0px) scale(0.7); opacity: 0.15; }
            50% { transform: translateY(-15px) translateX(8px) scale(1.35); opacity: 0.75; }
            100% { transform: translateY(-30px) translateX(0px) scale(0.7); opacity: 0.15; }
          }
        `}</style>
        <circle
          cx="25"
          cy="45"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust3 6s ease-in-out infinite" }}
        />
        <circle
          cx="35"
          cy="115"
          r="0.6"
          fill="#F5EBD6"
          style={{ animation: "floatGoldDust3 8s ease-in-out infinite 2s" }}
        />
        <circle
          cx="70"
          cy="55"
          r="0.7"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust3 7s ease-in-out infinite 4s" }}
        />
        <circle
          cx="85"
          cy="95"
          r="0.9"
          fill="#F5EBD6"
          style={{ animation: "floatGoldDust3 6s ease-in-out infinite" }}
        />
        <circle
          cx="45"
          cy="25"
          r="0.5"
          fill="#D8B76A"
          style={{ animation: "floatGoldDust3 8s ease-in-out infinite 2s" }}
        />
        <circle
          cx="65"
          cy="125"
          r="0.7"
          fill="#F5EBD6"
          style={{ animation: "floatGoldDust3 7s ease-in-out infinite 4s" }}
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/Dark Black Gold Marble.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes veinGlow {
            0%, 100% { opacity: 0.5; stroke-width: 0.8px; filter: drop-shadow(0 0 1px rgba(216,183,106,0.3)); }
            50% { opacity: 0.95; stroke-width: 1.2px; filter: drop-shadow(0 0 5px rgba(216,183,106,0.9)); }
          }
        `}</style>
        <path
          d="M100,5 Q70,40 85,75 Q100,110 80,145"
          stroke="#D8B76A"
          style={{ animation: "veinGlow 4s ease-in-out infinite" }}
          fill="none"
        />
        <path
          d="M100,35 Q85,55 92,80 Q99,105 100,120"
          stroke="#D8B76A"
          style={{ animation: "veinGlow 5s ease-in-out infinite 2.2s" }}
          fill="none"
        />
        <path
          d="M100,70 Q90,95 93,115 Q96,135 100,140"
          stroke="#D8B76A"
          style={{ animation: "veinGlow 4s ease-in-out infinite" }}
          fill="none"
        />
        <circle cx="88" cy="20" r="1" fill="#D8B76A" opacity="0.4" />
        <circle cx="94" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle cx="82" cy="95" r="0.75" fill="#D8B76A" opacity="0.3" />
        <circle cx="91" cy="130" r="1.2" fill="#D8B76A" opacity="0.4" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Burgundy Velvet Filigree.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes filigreeSpin {
            0% { transform: rotate(0deg); opacity: 0.7; }
            50% { opacity: 0.95; }
            100% { transform: rotate(360deg); opacity: 0.7; }
          }
        `}</style>
        <path d="M0,15 A15,15 0 0,0 15,0 L0,0 Z" fill="#3D0C1A" opacity="0.9" />
        <path
          d="M0,15 A15,15 0 0,0 15,0"
          stroke="#D8B76A"
          strokeWidth="0.75"
          opacity="0.8"
        />
        <path
          d="M0,12 A12,12 0 0,0 12,0"
          stroke="#D8B76A"
          strokeWidth="0.25"
          opacity="0.5"
        />
        <path
          d="M0,135 A15,15 0 0,1 15,150 L0,150 Z"
          fill="#3D0C1A"
          opacity="0.9"
        />
        <path
          d="M0,135 A15,15 0 0,1 15,150"
          stroke="#D8B76A"
          strokeWidth="0.75"
          opacity="0.8"
        />
        <path
          d="M0,138 A12,12 0 0,1 12,150"
          stroke="#D8B76A"
          strokeWidth="0.25"
          opacity="0.5"
        />
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="150"
          stroke="#D8B76A"
          strokeWidth="0.75"
          opacity="0.8"
        />
        <g
          style={{
            animation: "filigreeSpin 25s linear infinite",
            transformOrigin: "12px 75px",
          }}
        >
          <circle
            cx="12"
            cy="75"
            r="8"
            stroke="#D8B76A"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          <path
            d="M12,65 L12,85 M2,75 L22,75"
            stroke="#D8B76A"
            strokeWidth="0.5"
          />
        </g>
        <circle cx="12" cy="75" r="2.5" fill="#D8B76A" />
        <path
          d="M12,38 A7,7 0 0,1 12,52"
          stroke="#D8B76A"
          strokeWidth="0.75"
          fill="none"
          opacity="0.8"
        />
        <circle cx="16" cy="45" r="1.5" fill="#D8B76A" opacity="0.9" />
        <path
          d="M12,98 A7,7 0 0,1 12,112"
          stroke="#D8B76A"
          strokeWidth="0.75"
          fill="none"
          opacity="0.8"
        />
        <circle cx="16" cy="105" r="1.5" fill="#D8B76A" opacity="0.9" />
      </svg>
    );
  }

  if (customCardBg === "/templates/Royal Emerald Gold Frame.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes sparkleStar {
            0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
            50% { opacity: 1; transform: scale(1.1) rotate(90deg); filter: drop-shadow(0 0 5px #D8B76A); }
          }
        `}</style>
        <rect
          x="6"
          y="6"
          width="88"
          height="138"
          rx="8"
          fill="none"
          stroke="#D8B76A"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <rect
          x="7.5"
          y="7.5"
          width="85"
          height="135"
          rx="6.5"
          fill="none"
          stroke="#D8B76A"
          strokeWidth="0.5"
          opacity="0.3"
        />
        <path
          d="M6,20 Q16,16 20,6"
          stroke="#D8B76A"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M94,20 Q84,16 80,6"
          stroke="#D8B76A"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M6,130 Q16,134 20,144"
          stroke="#D8B76A"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M94,130 Q84,134 80,144"
          stroke="#D8B76A"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        <path
          style={{
            animation: "sparkleStar 3s ease-in-out infinite",
            transformOrigin: "20px 20px",
          }}
          d="M20,16 L21,19 L24,20 L21,21 L20,24 L19,21 L16,20 L19,19 Z"
          fill="#D8B76A"
        />
        <path
          style={{
            animation: "sparkleStar 3.5s ease-in-out infinite 1.2s",
            transformOrigin: "80px 20px",
          }}
          d="M80,16 L81,19 L84,20 L81,21 L80,24 L79,21 L76,20 L79,19 Z"
          fill="#D8B76A"
        />
        <path
          style={{
            animation: "sparkleStar 4s ease-in-out infinite 0.5s",
            transformOrigin: "20px 130px",
          }}
          d="M20,126 L21,129 L24,130 L21,131 L20,134 L19,131 L16,130 L19,129 Z"
          fill="#D8B76A"
        />
        <path
          style={{
            animation: "sparkleStar 3.2s ease-in-out infinite 1.8s",
            transformOrigin: "80px 130px",
          }}
          d="M80,126 L81,129 L84,130 L81,131 L80,134 L79,131 L76,130 L79,129 Z"
          fill="#D8B76A"
        />
      </svg>
    );
  }

  if (customCardBg === "/templates/Blush Pink & Rose Gold Glitter.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
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
        <g
          style={{
            animation: "glitterFall 10s linear infinite",
            transformOrigin: "center",
          }}
        >
          <circle cx="20" cy="10" r="1" fill="#E8B5AC" />
          <circle cx="45" cy="30" r="0.75" fill="#D8B76A" />
          <circle cx="75" cy="5" r="1.2" fill="#FFE5E9" />
          <path
            d="M85,25 L86,22 L89,21 L86,20 L85,17 L84,20 L81,21 L84,22 Z"
            fill="#E8B5AC"
          />
        </g>
        <g
          style={{
            animation: "glitterFall 14s linear infinite 3s",
            transformOrigin: "center",
          }}
        >
          <circle cx="15" cy="40" r="1.2" fill="#D8B76A" />
          <circle cx="60" cy="15" r="0.8" fill="#FFE5E9" />
          <circle cx="80" cy="50" r="1" fill="#E8B5AC" />
          <path
            d="M30,55 L31,52 L34,51 L31,50 L30,47 L29,50 L26,51 L29,52 Z"
            fill="#E8B5AC"
          />
        </g>
        <g
          style={{
            animation: "glitterFall 12s linear infinite 6s",
            transformOrigin: "center",
          }}
        >
          <circle cx="35" cy="25" r="0.8" fill="#E8B5AC" />
          <circle cx="70" cy="35" r="1.1" fill="#D8B76A" />
          <circle cx="90" cy="75" r="0.7" fill="#FFE5E9" />
          <path
            d="M55,100 L56,97 L59,96 L56,95 L55,92 L54,95 L51,96 L54,97 Z"
            fill="#E8B5AC"
          />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_5.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes leafDrift {
            0% { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0; }
            20% { opacity: 0.75; }
            80% { opacity: 0.75; }
            100% { transform: translateY(160px) translateX(-20px) rotate(180deg); opacity: 0; }
          }
        `}</style>
        <path
          d="M0,25 Q18,40 10,75 Q2,110 0,135"
          stroke="#7A8E7E"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path d="M9,32 C15,31 16,36 9,38 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M12,48 C18,49 16,54 12,53 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M11,68 C17,71 14,75 11,72 Z" fill="#99AB9D" opacity="0.6" />
        <path d="M6,90 C12,94 9,98 6,95 Z" fill="#99AB9D" opacity="0.5" />
        <path d="M4,112 C10,115 8,119 4,116 Z" fill="#99AB9D" opacity="0.5" />
        <g
          style={{
            animation: "leafDrift 12s linear infinite",
            transformOrigin: "center",
          }}
        >
          <path d="M45,20 C49,19 48,24 45,23 Z" fill="#99AB9D" opacity="0.7" />
          <path d="M75,50 C79,49 78,54 75,53 Z" fill="#99AB9D" opacity="0.6" />
        </g>
        <g
          style={{
            animation: "leafDrift 16s linear infinite 4s",
            transformOrigin: "center",
          }}
        >
          <path d="M60,30 C64,29 63,34 60,33 Z" fill="#99AB9D" opacity="0.5" />
          <path d="M30,80 C34,79 33,84 30,83 Z" fill="#99AB9D" opacity="0.6" />
        </g>
      </svg>
    );
  }

  if (customCardBg === "/templates/template_pro_6.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
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
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="150"
            strokeWidth="0.25"
            opacity="0.5"
          />
          <path
            d="M6,5 Q2,10 6,15 M6,20 Q2,25 6,30 M6,35 Q2,40 6,45 M6,50 Q2,55 6,60 M6,65 Q2,70 6,75 M6,80 Q2,85 6,90 M6,95 Q2,100 6,105 M6,110 Q2,115 6,120 M6,125 Q2,130 6,135 M6,140 Q2,145 6,150"
            fill="none"
          />
          <path
            d="M6,7 Q9,12 6,17 M6,22 Q9,27 6,32 M6,37 Q9,42 6,47 M6,52 Q9,57 6,62 M6,67 Q9,72 6,77 M6,82 Q9,87 6,92 M6,97 Q9,102 6,107 M6,112 Q9,117 6,122 M6,127 Q9,132 6,137 M6,142 Q9,147 6,147"
            fill="none"
            opacity="0.5"
          />
        </g>
        <g stroke="#D8B76A" strokeWidth="0.75" opacity="0.75">
          <line x1="94" y1="0" x2="94" y2="150" />
          <line
            x1="92"
            y1="0"
            x2="92"
            y2="150"
            strokeWidth="0.25"
            opacity="0.5"
          />
          <path
            d="M94,5 Q98,10 94,15 M94,20 Q98,25 94,30 M94,35 Q98,40 94,45 M94,50 Q98,55 94,60 M94,65 Q98,70 94,75 M94,80 Q98,85 94,90 M94,95 Q98,100 94,105 M94,110 Q98,115 94,120 M94,125 Q98,130 94,135 M94,140 Q98,145 94,150"
            fill="none"
          />
          <path
            d="M94,7 Q91,12 94,17 M94,22 Q91,27 94,32 M94,37 Q91,42 94,47 M94,52 Q91,57 94,62 M94,67 Q91,72 94,77 M94,82 Q91,87 94,92 M94,97 Q91,102 94,107 M94,112 Q91,117 94,122 M94,127 Q91,132 94,137 M94,142 Q91,147 94,147"
            fill="none"
            opacity="0.5"
          />
        </g>
        <g style={{ animation: "twinkle 3s ease-in-out infinite" }}>
          <path
            d="M22,30 L23,28 L25,27 L23,26 L22,24 L21,26 L19,27 L21,28 Z"
            fill="#FFFFFF"
          />
          <path
            d="M25,110 L26,108 L28,107 L26,106 L25,104 L24,106 L22,107 L24,108 Z"
            fill="#FFFFFF"
          />
        </g>
        <g style={{ animation: "twinkle 4s ease-in-out infinite 1.5s" }}>
          <path
            d="M78,45 L79,43 L81,42 L79,41 L78,39 L77,41 L75,42 L77,43 Z"
            fill="#FFFFFF"
          />
          <path
            d="M75,115 L76,113 L78,112 L76,111 L75,109 L74,111 L72,112 L74,113 Z"
            fill="#FFFFFF"
          />
        </g>
        <g style={{ animation: "shootingStar 8s linear infinite 2s" }}>
          <line
            x1="0"
            y1="0"
            x2="-25"
            y2="-25"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
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

  if (customCardBg === "/templates/template_pro_7.webp") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 150"
        fill="none"
        preserveAspectRatio="none"
      >
        <style>{`
          @keyframes charcoalGoldFloat {
            0%, 100% { transform: translateY(0px) scale(0.95); opacity: 0.4; }
            50% { transform: translateY(-8px) scale(1.05); opacity: 0.8; }
          }
        `}</style>
        <path
          d="M100,30 Q78,50 82,75 Q86,100 100,110"
          stroke="#D8B76A"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle
          cx="85"
          cy="55"
          r="4"
          stroke="#D8B76A"
          strokeWidth="0.6"
          fill="none"
          opacity="0.6"
          style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }}
        />
        <circle cx="85" cy="55" r="1.5" fill="#D8B76A" opacity="0.5" />
        <circle
          cx="80"
          cy="80"
          r="5"
          stroke="#D8B76A"
          strokeWidth="0.6"
          fill="none"
          opacity="0.6"
          style={{ animation: "charcoalGoldFloat 6s ease-in-out infinite 2s" }}
        />
        <circle cx="80" cy="80" r="2" fill="#D8B76A" opacity="0.5" />
        <path
          d="M78,48 Q70,42 76,38 Q82,34 84,42 Z"
          fill="#D8B76A"
          opacity="0.15"
        />
        <path
          d="M72,72 Q64,66 70,62 Q76,58 78,66 Z"
          fill="#D8B76A"
          opacity="0.15"
        />
        <circle
          cx="45"
          cy="40"
          r="0.8"
          fill="#D8B76A"
          style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }}
        />
        <circle
          cx="35"
          cy="90"
          r="1"
          fill="#D8B76A"
          style={{ animation: "charcoalGoldFloat 6s ease-in-out infinite 2s" }}
        />
        <circle
          cx="65"
          cy="115"
          r="0.6"
          fill="#D8B76A"
          style={{ animation: "charcoalGoldFloat 5s ease-in-out infinite" }}
        />
      </svg>
    );
  }

  return null;
};

export default TemplateBackgroundGraphics;
