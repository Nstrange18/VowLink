import { Icon } from "@iconify/react";

const WeddingDayParticles = () => {
  const pieces = Array.from({ length: 40 }).map((_, i) => {
    const left = `${Math.random() * 100}vw`;
    const size = `${Math.random() * 15 + 10}px`;
    const delay = `${Math.random() * 5}s`;
    const duration = `${Math.random() * 4 + 4}s`;
    const icon = [
      "mdi:heart",
      "lucide:sparkles",
      "mdi:ring",
      "mdi:flower",
      "mdi:glass-cocktail",
    ][Math.floor(Math.random() * 5)];
    return {
      id: i,
      icon,
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
      },
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatDown {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
          }
        }
      `,
        }}
      />
      {pieces.map((p) => (
        <Icon key={p.id} icon={p.icon} style={p.style} />
      ))}
    </div>
  );
};

export default WeddingDayParticles;
