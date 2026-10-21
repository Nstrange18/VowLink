import { Icon } from "@iconify/react";

const OrnamentDivider = ({
  dividerType,
  color,
  spacing = "my-3",
  isSecondary = false,
}) => {
  const lineStyle = { background: color, opacity: isSecondary ? 0.3 : 0.4 };
  const getDividerIcon = () => {
    if (dividerType === "floral-rose")
      return isSecondary ? "mdi:flower-tulip-outline" : "mdi:flower";
    if (dividerType === "leaf-right" || dividerType === "eucalyptus")
      return "mdi:leaf";
    if (dividerType === "gold-royal")
      return isSecondary ? "lucide:sparkle" : "mdi:crown-outline";
    if (dividerType === "starry" || dividerType === "glitter")
      return isSecondary ? "lucide:sparkle" : "lucide:sparkles";
    if (dividerType === "filigree") return "mdi:ornament";
    return isSecondary ? "lucide:sparkle" : "mdi:flower-pollen-outline";
  };
  const dividerIcon = getDividerIcon();

  if (dividerType === "gold-royal") {
    return (
      <div className={`flex items-center gap-2 select-none ${spacing}`}>
        <div className="h-[1.5px] w-12 bg-linear-to-r from-transparent to-[#D8B76A]" />
        <Icon icon={dividerIcon} className="h-3.5 w-3.5 text-[#D8B76A]" />
        <div className="h-[1.5px] w-12 bg-linear-to-l from-transparent to-[#D8B76A]" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${spacing}`}>
      <div className="h-px w-10" style={lineStyle} />
      <Icon
        icon={dividerIcon}
        className="h-3.5 w-3.5"
        style={{
          color:
            dividerType?.includes("gold") || dividerType === "glitter"
              ? "#D8B76A"
              : color,
        }}
      />
      <div className="h-px w-10" style={lineStyle} />
    </div>
  );
};

export default OrnamentDivider;
