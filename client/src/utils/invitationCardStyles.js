// Preserve legacy template defaults and custom-background precedence.
export const getInvitationCardStyles = ({ activeFont, cardTheme, selectedBgHex, customTextColor, secHex, customCardBg }) => {
  let cardStyles = {
    background: "radial-gradient(circle, #FFFDF9 60%, #FAF6F0 100%)",
    color: "#1A2E4A",
    fontFamily: activeFont,
  };

  if (cardTheme === "floral") {
    cardStyles = {
      background:
        selectedBgHex || "radial-gradient(circle, #FFFDF9 60%, #FAF6F0 100%)",
      color: customTextColor || "#1A2E4A",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "minimalist") {
    cardStyles = {
      background: "radial-gradient(circle, #FFFFFF 60%, #F5F7FA 100%)",
      border: `8px double ${secHex}33`,
      color:
        customTextColor && customTextColor !== "#1A2E4A"
          ? customTextColor
          : "#2E3A59",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "navy") {
    cardStyles = {
      background:
        "url('/templates/elegant_gold_frame_with_navy_backdrop.webp') 0% 0% / 100% 100% no-repeat",
      color:
        customTextColor && customTextColor !== "#1A2E4A"
          ? customTextColor
          : "#D8B76A",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "stardust") {
    cardStyles = {
      background: "radial-gradient(circle, #0D0B1C 0%, #05040B 100%)",
      color:
        customTextColor && customTextColor !== "#1A2E4A"
          ? customTextColor
          : "#FFFFFF",
      fontFamily: activeFont,
    };
  } else if (cardTheme === "forest") {
    cardStyles = {
      background: "radial-gradient(circle, #071C11 0%, #030C07 100%)",
      color:
        customTextColor && customTextColor !== "#1A2E4A"
          ? customTextColor
          : secHex,
      fontFamily: activeFont,
    };
  } else if (cardTheme === "custom" && customCardBg) {
    let bg = `url('${customCardBg}') 0% 0% / 100% 100% no-repeat`;
    let color = "#1A2E4A";

    switch (customCardBg) {
      case "/templates/template_free_1.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#1A2E4A";
        break;
      case "/templates/template_free_2.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#4A5D4E";
        break;
      case "/templates/template_free_3.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#6E5B4F";
        break;
      case "/templates/Blush Pink Watercolor.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#3D2124";
        break;
      case "/templates/Cream Floral Elegance.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#6B5847";
        break;
      case "/templates/template_plus_1.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#B8963A";
        break;
      case "/templates/template_plus_2.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#800020";
        break;
      case "/templates/Emerald Eucalyptus Frame.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#E2E8F0";
        break;
      case "/templates/elegant_gold_frame_with_navy_backdrop.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D8B76A";
        break;
      case "/templates/Royal Navy Lace Accent.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#F5EBD6";
        break;
      case "/templates/Elegant purple and silver floral.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#3C2A4D";
        break;
      case "/templates/template_pro_1.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D4AF37";
        break;
      case "/templates/template_pro_2.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#E2E8F0";
        break;
      case "/templates/template_pro_3.png":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D8B76A";
        break;
      case "/templates/template_pro_4.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D4AF37";
        break;
      case "/templates/template_plus_3.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#F5EBD6";
        break;
      case "/templates/Midnight Black Floral2.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#F5EBD6";
        break;
      case "/templates/Dark Black Gold Marble.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D8B76A";
        break;
      case "/templates/Burgundy Velvet Filigree.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#F5EBD6";
        break;
      case "/templates/Royal Emerald Gold Frame.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D8B76A";
        break;
      case "/templates/Blush Pink & Rose Gold Glitter.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#8C715A";
        break;
      case "/templates/template_pro_5.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#5C6B5E";
        break;
      case "/templates/template_pro_6.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#F5EBD6";
        break;
      case "/templates/template_pro_7.webp":
        color =
          customTextColor && customTextColor !== "#1A2E4A"
            ? customTextColor
            : "#D8B76A";
        break;
      default:
        if (customCardBg.startsWith("/Free Plan Vowlink/")) {
          color =
            customTextColor && customTextColor !== "#1A2E4A"
              ? customTextColor
              : "#1A2E4A";
        } else if (customCardBg.startsWith("/Plus Plans Vowlink/")) {
          const isDark =
            customCardBg.includes("Midnight") ||
            customCardBg.includes("Velvet") ||
            customCardBg.includes("Dark") ||
            customCardBg.includes("Onyx") ||
            customCardBg.includes("Black") ||
            customCardBg.includes("Navy");
          const defaultColor = isDark ? "#F5EBD6" : "#1A2E4A";
          color =
            customTextColor && customTextColor !== "#1A2E4A"
              ? customTextColor
              : defaultColor;
        } else if (customCardBg.startsWith("/Pro Plans Vowlink/")) {
          const isDark =
            customCardBg.includes("Midnight") ||
            customCardBg.includes("Velvet") ||
            customCardBg.includes("Dark") ||
            customCardBg.includes("Onyx") ||
            customCardBg.includes("Black") ||
            customCardBg.includes("Navy") ||
            customCardBg.includes("Purple") ||
            customCardBg.includes("Blue") ||
            customCardBg.includes("Emerald") ||
            customCardBg.includes("Celestial") ||
            customCardBg.includes("(1).png") ||
            customCardBg.includes("(2).png") ||
            customCardBg.includes("(3).png") ||
            customCardBg.includes("(5).png") ||
            customCardBg.includes("(6).png") ||
            customCardBg.includes("(7).png") ||
            customCardBg.includes("(10).png");
          const defaultColor = isDark ? "#F5EBD6" : "#1A2E4A";
          color =
            customTextColor && customTextColor !== "#1A2E4A"
              ? customTextColor
              : defaultColor;
        } else if (
          customCardBg.startsWith("https://res.cloudinary.com") &&
          customCardBg.includes("ai_backgrounds")
        ) {
          // AI-generated backgrounds — default to light/ivory text since AI-generated backgrounds are typically rich/dark
          color =
            customTextColor && customTextColor !== "#1A2E4A"
              ? customTextColor
              : "#F5EBD6";
        } else {
          color =
            customTextColor && customTextColor !== "#1A2E4A"
              ? customTextColor
              : "#1A2E4A";
        }
    }
    cardStyles = {
      background: bg,
      color: color,
      fontFamily: activeFont,
    };
  }
  return cardStyles;
};
