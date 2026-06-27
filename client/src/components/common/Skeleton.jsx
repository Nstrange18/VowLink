import React from "react";

/**
 * Reusable Skeleton loader component matching VowLink's premium dark theme aesthetics.
 * Uses Tailwind CSS animate-pulse for clean loading states.
 */
const Skeleton = ({ className = "", variant = "rect", width, height }) => {
  const baseClasses = "animate-pulse bg-white/5 border border-white/5 shadow-inner";
  
  const variantClasses = {
    circle: "rounded-full",
    rect: "rounded-2xl",
    text: "rounded-lg h-3 w-full",
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.rect} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
