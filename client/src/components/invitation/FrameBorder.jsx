const FrameBorder = ({ frameBorder }) => {
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

export default FrameBorder;
