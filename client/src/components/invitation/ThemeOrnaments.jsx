import { Icon } from "@iconify/react";

const ThemeOrnaments = ({ theme, pri, sec, ter, isFreeUser }) => {
  const flowerColor = isFreeUser ? "#8C715A" : pri;
  const leafColor = isFreeUser ? "#A3B899" : sec;
  const accentColor = isFreeUser ? "#D4C5B9" : ter;

  if (theme === "floral") {
    return (
      <>
        {/* Top-Left Floral Cluster */}
        <svg
          className="absolute top-0 left-0 w-28 h-28 pointer-events-none select-none opacity-85 z-0"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M0,0 Q30,10 50,40 Q40,60 30,70"
            stroke={leafColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M0,0 Q10,30 30,60 Q50,70 60,80"
            stroke={leafColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Leaf Shapes */}
          <path
            d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12"
            fill={leafColor}
            opacity="0.8"
          />
          <path
            d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25"
            fill={leafColor}
            opacity="0.8"
          />
          <path
            d="M40,30 C35,38 45,45 48,38 C43,30 40,30 40,30"
            fill={leafColor}
            opacity="0.7"
          />
          <path
            d="M30,48 C25,55 35,62 38,55 C33,48 30,48 30,48"
            fill={leafColor}
            opacity="0.7"
          />

          {/* Flower blooms */}
          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <path
            d="M9,15 C9,9 21,9 21,15 C21,21 9,21 9,15 Z"
            fill={flowerColor}
            opacity="0.9"
          />
          <circle cx="15" cy="15" r="4" fill={accentColor} />

          <circle cx="38" cy="20" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="20" cy="38" r="6" fill={flowerColor} opacity="0.95" />
          <circle cx="38" cy="20" r="2.5" fill={accentColor} />
          <circle cx="20" cy="38" r="2.5" fill={accentColor} />
        </svg>

        {/* Bottom-Right Floral Cluster */}
        <svg
          className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none select-none opacity-85 rotate-180 z-0"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M0,0 Q30,10 50,40 Q40,60 30,70"
            stroke={leafColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M0,0 Q10,30 30,60 Q50,70 60,80"
            stroke={leafColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Leaf Shapes */}
          <path
            d="M25,12 C20,18 28,24 35,18 C30,12 25,12 25,12"
            fill={leafColor}
            opacity="0.8"
          />
          <path
            d="M12,25 C18,20 24,28 18,35 C12,30 12,25 12,25"
            fill={leafColor}
            opacity="0.8"
          />
          <path
            d="M40,30 C35,38 45,45 48,38 C43,30 40,30 40,30"
            fill={leafColor}
            opacity="0.7"
          />
          <path
            d="M30,48 C25,55 35,62 38,55 C33,48 30,48 30,48"
            fill={leafColor}
            opacity="0.7"
          />

          {/* Flower blooms */}
          <circle cx="15" cy="15" r="9" fill={flowerColor} />
          <path
            d="M9,15 C9,9 21,9 21,15 C21,21 9,21 9,15 Z"
            fill={flowerColor}
            opacity="0.9"
          />
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
      <svg
        className="absolute top-4 left-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none select-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill="none"
          stroke={pri}
          strokeWidth="0.75"
          opacity="0.4"
        />
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          fill="none"
          stroke={sec}
          strokeWidth="0.5"
          opacity="0.3"
        />

        <path d="M10,4 L4,4 L4,10" fill="none" stroke={pri} strokeWidth="1" />
        <path d="M90,4 L96,4 L96,10" fill="none" stroke={pri} strokeWidth="1" />
        <path d="M10,96 L4,96 L4,90" fill="none" stroke={pri} strokeWidth="1" />
        <path
          d="M90,96 L96,96 L96,90"
          fill="none"
          stroke={pri}
          strokeWidth="1"
        />
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
        <div
          className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full blur-[60px] opacity-25"
          style={{ backgroundColor: pri }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-[60px] opacity-20"
          style={{ backgroundColor: sec }}
        />
        <div
          className="absolute top-10 left-10 w-2 h-2 rounded-full bg-white opacity-80"
          style={{
            animation: "invite-sd-ping 3s cubic-bezier(0,0,0.2,1) infinite",
          }}
        />
        <div
          className="absolute top-1/3 right-12 w-1.5 h-1.5 rounded-full bg-white opacity-60"
          style={{
            animation: "invite-sd-ping 5s cubic-bezier(0,0,0.2,1) infinite",
          }}
        />
        <div
          className="absolute bottom-1/3 left-16 w-2.5 h-2.5 rounded-full bg-white opacity-40"
          style={{
            animation: "invite-sd-pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
          }}
        />
        <div
          className="absolute bottom-20 right-20 w-2 h-2 rounded-full bg-white opacity-90"
          style={{
            animation:
              "invite-sd-pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite",
          }}
        />
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
        <svg
          className="absolute top-0 left-0 w-full h-20 opacity-80"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 Q10,8 20,2 Q30,12 40,4 Q50,15 60,3 Q70,12 80,2 Q90,10 100,0"
            stroke={sec}
            strokeWidth="1.2"
            fill="none"
          />
          <circle cx="10" cy="5" r="2" fill={pri} />
          <circle cx="28" cy="7" r="2.5" fill={sec} />
          <circle cx="48" cy="9" r="2.2" fill={pri} />
          <circle cx="68" cy="8" r="2" fill={sec} />
          <circle cx="88" cy="6" r="1.8" fill={pri} />
        </svg>
        <Icon
          icon="mdi:leaf"
          className="absolute top-5 left-1/4 h-4 w-4"
          style={{ animation: "invite-forest-bounce 6s infinite", color: pri }}
        />
        <Icon
          icon="mdi:leaf-maple"
          className="absolute top-12 left-2/3 h-4 w-4"
          style={{
            animation: "invite-forest-bounce 8s infinite",
            animationDelay: "2s",
            color: sec,
          }}
        />
        <Icon
          icon="mdi:leaf"
          className="absolute top-20 right-10 h-4 w-4"
          style={{
            animation: "invite-forest-bounce 5s infinite",
            animationDelay: "1s",
            color: pri,
          }}
        />
      </div>
    );
  }

  return null;
};

export default ThemeOrnaments;
