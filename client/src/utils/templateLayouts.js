/**
 * Returns the layout configuration (paddings, alignments, shadows, and borders)
 * for each template to prevent invitation text from overlapping with background
 * illustrations or frames, and to give each card design a premium distinct vibe.
 * 
 * Users can still override alignment and offsets using manual settings.
 */

const normalizeTemplateUrl = (url) =>
  typeof url === "string" ? url.replace(/\.(png|jpe?g)$/i, ".webp") : url;

const createPreset = (
  tier,
  defaultAlign,
  pt,
  pb,
  pl,
  pr,
  textShadow,
  dividerType,
  frameBorder,
  safeMaxW,
  blockAligns = {},
  textColorConfig = {},
  contrastHelpers = {}
) => {
  const safeArea = {
    maxWidth: safeMaxW || "80%",
    paddingTop: `${pt}px`,
    paddingBottom: `${pb}px`,
    paddingLeft: `${pl}px`,
    paddingRight: `${pr}px`,
  };

  const getAlign = (name) => blockAligns[name] || defaultAlign;

  const blocks = {
    title: { align: getAlign("title"), fontSize: { preview: "1.25em", invite: "2em" }, marginBottom: { preview: "8px", invite: "12px" } },
    subtitle: { align: getAlign("subtitle"), fontSize: { preview: "0.75em", invite: "1.35em" }, marginBottom: { preview: "4px", invite: "4px" } },
    coupleNames: { align: getAlign("coupleNames"), fontSize: { preview: "1.8em", invite: "2.6em" }, marginBottom: { preview: "4px", invite: "4px" }, marginTop: { preview: "4px", invite: "0px" } },
    greeting: { align: getAlign("greeting"), fontSize: { preview: "0.75em", invite: "1.6em" }, marginBottom: { preview: "12px", invite: "12px" } },
    message: { align: getAlign("message"), fontSize: { preview: "0.7em", invite: "1em" }, lineHeight: { preview: "inherit", invite: "1.8" }, maxWidth: { preview: "240px", invite: "240px" }, marginBottom: { preview: "16px", invite: "20px" } },
    details: { align: getAlign("details"), fontSize: { preview: "0.75em", invite: "0.95em" }, marginBottom: { preview: "4px", invite: "8px" }, maxWidth: { preview: "240px", invite: "260px" } },
    reception: { align: getAlign("reception"), fontSize: { preview: "0.75em", invite: "0.95em" }, marginBottom: { preview: "12px", invite: "20px" }, maxWidth: { preview: "240px", invite: "260px" } },
    colors: { align: getAlign("colors"), fontSize: { preview: "0.6em", invite: "0.8em" }, marginTop: { preview: "12px", invite: "0px" }, marginBottom: { preview: "0px", invite: "16px" } }
  };

  const isDark = ["navy", "stardust", "forest"].includes(dividerType) || tier === "pro" || (dividerType && dividerType.includes("gold"));

  // Merge default text color configurations if not fully provided
  const mergedTextColorConfig = {
    title: isDark ? "#D8B76A" : "#1A2E4A",
    subtitle: isDark ? "#EADFC8" : "#7D6B62",
    coupleNames: isDark ? "#FFFFFF" : "#8C715A",
    greeting: isDark ? "#FFF5E0" : "#1A2E4A",
    message: isDark ? "#EADFC8" : "#5A4A42",
    details: isDark ? "#FFF5E0" : "#7D6B62",
    colourOfDay: isDark ? "#D8B76A" : "#8C715A",
    chips: "#FFFFFF",
    divider: isDark ? "#D8B76A" : "#8C715A",
    ...textColorConfig
  };

  return {
    pt, pb, pl, pr,
    align: defaultAlign,
    textShadow,
    dividerType,
    frameBorder,
    tier,
    textColorConfig: mergedTextColorConfig,
    contrastHelpers: {
      textShadow: contrastHelpers.textShadow || textShadow || "none",
      softGlow: contrastHelpers.softGlow || "none",
      overlayBehindText: contrastHelpers.overlayBehindText || false,
      contrastMode: contrastHelpers.contrastMode || "none",
      stroke: contrastHelpers.stroke || "none",
      ...contrastHelpers
    },
    layoutConfig: {
      safeArea,
      blocks
    }
  };
};

export const getTemplateLayout = (theme, customCardBg) => {
  customCardBg = normalizeTemplateUrl(customCardBg);
  if (theme !== "custom" || !customCardBg) {
    // Fallbacks for built-in styling themes (floral, minimalist, navy, stardust, forest)
    switch (theme) {
      case "floral":
        return createPreset("free", "center", 80, 90, 40, 40, "none", "floral", null, "85%", {}, {
          title: "#5C4A3C", subtitle: "#826D5F", coupleNames: "#A08068", greeting: "#5C4A3C", message: "#6B584B", details: "#826D5F", colourOfDay: "#A08068", chips: "#FFFFFF", divider: "#A08068"
        });
      case "minimalist":
        return createPreset("plus", "center", 80, 90, 40, 40, "none", "minimalist", "minimalist", "85%", {}, {
          title: "#1A2536", subtitle: "#475569", coupleNames: "#0F172A", greeting: "#334155", message: "#475569", details: "#475569", colourOfDay: "#0F172A", chips: "#475569", divider: "#0F172A"
        });
      case "navy":
        return createPreset("plus", "center", 85, 95, 45, 45, "0 0 6px rgba(201, 168, 76, 0.4)", "gold", "gold", "85%", {}, {
          title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
        }, { textShadow: "0 0 6px rgba(201, 168, 76, 0.4)" });
      case "stardust":
        return createPreset("pro", "center", 80, 90, 40, 40, "0 0 10px rgba(255,255,255,0.6)", "stardust", null, "85%", {}, {
          title: "#E2E8F0", subtitle: "#CBD5E1", coupleNames: "#FFFFFF", greeting: "#E2E8F0", message: "#CBD5E1", details: "#94A3B8", colourOfDay: "#E2E8F0", chips: "#FFFFFF", divider: "#FFFFFF"
        }, { softGlow: "0 0 10px rgba(255,255,255,0.4)" });
      case "forest":
        return createPreset("pro", "center", 80, 90, 40, 40, "0 0 8px rgba(245, 214, 143, 0.5)", "forest", null, "85%", {}, {
          title: "#D4AF37", subtitle: "#FFFDF9", coupleNames: "#F5D68F", greeting: "#FFF5E0", message: "#F5EBD6", details: "#E6DFDA", colourOfDay: "#D4AF37", chips: "#FFFFFF", divider: "#D4AF37"
        }, { softGlow: "0 0 8px rgba(245, 214, 143, 0.3)" });
      default:
        return createPreset("free", "center", 80, 90, 35, 35, "none", "default", null, "85%");
    }
  }

  if (customCardBg) {
    if (customCardBg.startsWith("/Free Plan Vowlink/")) {
      return createPreset("free", "center", 130, 130, 85, 85, "none", "floral", null, "72%", {}, {
        title: "#4A5D4E", subtitle: "#7A8F7F", coupleNames: "#3E4F42", greeting: "#4A5D4E", message: "#5C6F60", details: "#7A8F7F", colourOfDay: "#3E4F42", chips: "#FFFFFF", divider: "#3E4F42"
      });
    }
    if (customCardBg.startsWith("/Plus Plans Vowlink/")) {
      const isDark = customCardBg.includes("Midnight") || customCardBg.includes("Velvet") || customCardBg.includes("Dark") || customCardBg.includes("Onyx") || customCardBg.includes("Black") || customCardBg.includes("Navy");
      if (isDark) {
        return createPreset("plus", "center", 135, 135, 90, 90, "0 1px 3px rgba(0,0,0,0.5)", "gold", "gold-thin", "70%", {}, {
          title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
        }, { textShadow: "0 1px 3px rgba(0,0,0,0.7)" });
      } else {
        return createPreset("plus", "center", 135, 135, 90, 90, "none", "floral", null, "70%", {}, {
          title: "#1A2E4A", subtitle: "#7D6B62", coupleNames: "#8C715A", greeting: "#1A2E4A", message: "#5A4A42", details: "#7D6B62", colourOfDay: "#8C715A", chips: "#FFFFFF", divider: "#8C715A"
        });
      }
    }
    if (customCardBg.startsWith("/Pro Plans Vowlink/")) {
      const isDark = customCardBg.includes("Midnight") || customCardBg.includes("Velvet") || customCardBg.includes("Dark") || customCardBg.includes("Onyx") || customCardBg.includes("Black") || customCardBg.includes("Navy") || customCardBg.includes("Purple") || customCardBg.includes("Blue") || customCardBg.includes("Emerald") || customCardBg.includes("Celestial") || customCardBg.includes("(1).png") || customCardBg.includes("(2).png") || customCardBg.includes("(3).png") || customCardBg.includes("(5).png") || customCardBg.includes("(6).png") || customCardBg.includes("(7).png") || customCardBg.includes("(10).png");
      if (isDark) {
        return createPreset("pro", "center", 145, 145, 90, 90, "0 2px 4px rgba(216, 183, 106, 0.5)", "gold-royal", "gold-royal", "72%", {}, {
          title: "#D8B76A", subtitle: "#FFFDF9", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D8B76A", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
        }, { textShadow: "0 2px 4px rgba(0,0,0,0.6)" });
      } else {
        return createPreset("pro", "center", 145, 145, 90, 90, "none", "linen", null, "72%", {}, {
          title: "#2F3E36", subtitle: "#526756", coupleNames: "#526756", greeting: "#2F3E36", message: "#354F52", details: "#526756", colourOfDay: "#2F3E36", chips: "#FFFFFF", divider: "#526756"
        });
      }
    }
    // AI-generated Cloudinary backgrounds — use Pro-tier preset with ivory/gold text (AI backgrounds are typically rich)
    if (customCardBg.startsWith("https://res.cloudinary.com") && customCardBg.includes("ai_backgrounds")) {
      return createPreset("pro", "center", 100, 100, 55, 55, "0 2px 6px rgba(0,0,0,0.5)", "gold-royal", "gold-royal", "78%", {}, {
        title: "#F5EBD6", subtitle: "#D8B76A", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D8B76A", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 1px 3px rgba(0,0,0,0.7)" });
    }
  }

  // Layout parameters for premium pre-made background designs
  switch (customCardBg) {
    case "/templates/template_free_1.webp": // Classic Navy, Gold & Cream
      return createPreset("plus", "center", 95, 95, 50, 50, "none", "default", null, "80%", {}, {
        title: "#1A2E4A", subtitle: "#2E3A59", coupleNames: "#B8963A", greeting: "#1A2E4A", message: "#2E3A59", details: "#1A2E4A", colourOfDay: "#B8963A", chips: "#FFFFFF", divider: "#B8963A"
      });

    case "/templates/template_free_2.png": // Ethereal Botanical Crest - Free
      return createPreset("free", "center", 120, 120, 80, 80, "none", "floral", null, "75%", {}, {
        title: "#4A5D4E", subtitle: "#7A8F7F", coupleNames: "#3E4F42", greeting: "#4A5D4E", message: "#5C6F60", details: "#7A8F7F", colourOfDay: "#3E4F42", chips: "#FFFFFF", divider: "#3E4F42"
      });

    case "/templates/template_free_3.png": // Rustic Whimsical Floral - Free
      return createPreset("free", "center", 130, 130, 85, 85, "none", "floral", null, "72%", {}, {
        title: "#6E5B4F", subtitle: "#9C8A7E", coupleNames: "#524339", greeting: "#6E5B4F", message: "#7D6B5F", details: "#9C8A7E", colourOfDay: "#524339", chips: "#FFFFFF", divider: "#524339"
      });

    case "/templates/Blush Pink Watercolor.webp": // Blush Pink Watercolor - Align Left (flowers top-right & bottom-left)
      return createPreset("free", "left", 150, 160, 70, 125, "1px 1px 3px rgba(140, 113, 90, 0.15)", "floral-rose", null, "62%", {}, {
        title: "#5C3A21", subtitle: "#8C5E58", coupleNames: "#8C715A", greeting: "#5C3A21", message: "#6B4E38", details: "#8C715A", colourOfDay: "#8C715A", chips: "#FFFFFF", divider: "#8C715A"
      }, { textShadow: "1px 1px 3px rgba(140, 113, 90, 0.15)" });

    case "/templates/Cream Floral Elegance.webp": // Cream Floral Elegance - Center (flowers on all 4 corners)
      return createPreset("free", "center", 145, 170, 110, 110, "none", "leaf-right", null, "68%", {}, {
        title: "#5C4C3E", subtitle: "#826D5A", coupleNames: "#826D5A", greeting: "#5C4C3E", message: "#6B5847", details: "#826D5A", colourOfDay: "#5C4C3E", chips: "#FFFFFF", divider: "#826D5A"
      });

    case "/templates/template_plus_1.webp": // Golden Arch Minimalist - Plus
      return createPreset("plus", "center", 140, 140, 90, 90, "none", "gold", "gold-thin", "70%", {}, {
        title: "#B8963A", subtitle: "#4A4A4A", coupleNames: "#1A1A1A", greeting: "#2B2B2B", message: "#4A4A4A", details: "#4A4A4A", colourOfDay: "#B8963A", chips: "#FFFFFF", divider: "#B8963A"
      });

    case "/templates/template_plus_2.png": // Ornate Royal Damask - Plus
      return createPreset("plus", "center", 150, 150, 95, 95, "0 0 4px rgba(255,255,255,0.3)", "lace", "lace", "68%", {}, {
        title: "#800020", subtitle: "#4A4A4A", coupleNames: "#800020", greeting: "#2B2B2B", message: "#4A4A4A", details: "#4D4D4D", colourOfDay: "#800020", chips: "#FFFFFF", divider: "#800020"
      }, { textShadow: "0 0 6px rgba(0,0,0,0.6)" });

    case "/templates/Emerald Eucalyptus Frame.webp": // Emerald Eucalyptus Frame - Center (leaves on all 4 sides)
      return createPreset("plus", "center", 165, 175, 95, 95, "0 1px 4px rgba(0,0,0,0.1)", "eucalyptus", "eucalyptus", "70%", {}, {
        title: "#b1c4beff", subtitle: "#639c87ff", coupleNames: "#D8B76A", greeting: "#88d1b6ff", message: "#88d1b6ff", details: "#a5b1adff", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "none" });

    case "/templates/elegant_gold_frame_with_navy_backdrop.webp": // Royal Navy Gold Frame
      return createPreset("plus", "center", 120, 120, 100, 100, "0 0 6px rgba(216, 183, 106, 0.5)", "gold", "gold", "68%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 8px rgba(0,0,0,0.7)" });

    case "/templates/Royal Navy Lace Accent.webp": // Royal Navy Lace Accent - Center (symmetric lace on both sides)
      return createPreset("plus", "center", 110, 110, 130, 130, "0 0 4px rgba(255,255,255,0.2)", "lace", "lace", "60%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 6px rgba(0,0,0,0.6)" });

    case "/templates/Elegant purple and silver floral.webp": // Elegant Purple & Silver Floral - Center
      return createPreset("plus", "center", 145, 145, 90, 90, "none", "floral", "gold-thin", "70%", {}, {
        title: "#3C2A4D", subtitle: "#5C3E75", coupleNames: "#2D1D3D", greeting: "#3C2A4D", message: "#5C3E75", details: "#3C2A4D", colourOfDay: "#120f14ff", chips: "#FFFFFF", divider: "#3C2A4D"
      }, { textShadow: "none" });

    case "/templates/template_pro_1.png": // Gilded Emerald Luxury - Pro
      return createPreset("pro", "center", 155, 155, 90, 90, "0 1px 3px rgba(0,0,0,0.6)", "gold-royal", "gold-royal", "72%", {}, {
        title: "#D4AF37", subtitle: "#FFFDF9", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D4AF37", colourOfDay: "#D4AF37", chips: "#FFFFFF", divider: "#D4AF37"
      }, { textShadow: "0 2px 4px rgba(0,0,0,0.6)" });

    case "/templates/template_pro_2.png": // Platinum Sparkle Elegance - Pro
      return createPreset("pro", "center", 150, 150, 95, 95, "0 0 5px rgba(255,255,255,0.4)", "stardust", "dashed-gold", "70%", {}, {
        title: "#E2E8F0", subtitle: "#CBD5E1", coupleNames: "#FFFFFF", greeting: "#E2E8F0", message: "#CBD5E1", details: "#94A3B8", colourOfDay: "#E2E8F0", chips: "#FFFFFF", divider: "#E2E8F0"
      }, { softGlow: "0 0 10px rgba(255,255,255,0.4)" });

    case "/templates/template_pro_3.png": // Stardust Cosmic Shimmer - Pro
      return createPreset("pro", "left", 140, 140, 100, 70, "1px 1px 4px rgba(0,0,0,0.8)", "gold-foil", null, "65%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "1px 1px 4px rgba(0,0,0,0.8)" });

    case "/templates/template_pro_4.webp": // Luxe Marble Geometric - Pro
      return createPreset("pro", "right", 135, 135, 65, 110, "0 1px 3px rgba(0,0,0,0.7)", "gold", null, "66%", {}, {
        title: "#D4AF37", subtitle: "#FFFDF9", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D4AF37", colourOfDay: "#D4AF37", chips: "#FFFFFF", divider: "#D4AF37"
      }, { textShadow: "0 2px 4px rgba(0,0,0,0.6)" });

    case "/templates/template_plus_3.webp": // Midnight Black Floral
      return createPreset("pro", "center", 105, 105, 55, 55, "none", "default", null, "80%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#F5EBD6", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 8px rgba(0,0,0,0.7)" });

    case "/templates/Midnight Black Floral2.webp": // Midnight Rose
      return createPreset("pro", "center", 110, 110, 60, 60, "none", "default", null, "80%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#F5EBD6", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 8px rgba(0,0,0,0.7)" });

    case "/templates/Dark Black Gold Marble.webp": // Dark Black Gold Marble - Align Left (Marble on Right)
      return createPreset("pro", "left", 110, 110, 75, 120, "1px 1px 4px rgba(216, 183, 106, 0.7)", "gold-foil", "dashed-gold", "65%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "1px 1px 4px rgba(0,0,0,0.8)" });

    case "/templates/Burgundy Velvet Filigree.webp": // Burgundy Velvet Filigree - Center (filigree on both sides)
      return createPreset("pro", "center", 120, 120, 100, 100, "1px 1px 3px rgba(216, 183, 106, 0.5)", "filigree", "gold-thin", "68%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#F5EBD6", greeting: "#FFF5E0", message: "#EADFC8", details: "#FFF5E0", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 6px rgba(0,0,0,0.7)" });

    case "/templates/Royal Emerald Gold Frame.webp": // Royal Emerald Gold Frame - Center inside frame
      return createPreset("pro", "center", 145, 145, 80, 80, "0 2px 5px rgba(216, 183, 106, 0.6)", "gold-royal", "gold-royal", "72%", {}, {
        title: "#D8B76A", subtitle: "#FFFDF9", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D8B76A", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 2px 4px rgba(0,0,0,0.6)" });

    case "/templates/Blush Pink & Rose Gold Glitter.webp": // Blush Pink & Rose Gold Glitter - Align Left (Glitter on Right)
      return createPreset("pro", "left", 115, 115, 70, 120, "1px 1px 3px rgba(184, 150, 58, 0.4)", "glitter", null, "65%", {}, {
        title: "#5C3A21", subtitle: "#8C715A", coupleNames: "#8C715A", greeting: "#5C3A21", message: "#6B5847", details: "#8C715A", colourOfDay: "#5C3A21", chips: "#FFFFFF", divider: "#8C715A"
      });

    case "/templates/template_pro_5.webp": // Minimalist Linen Ivory Leaves - Align Right (Leaves on Left)
      return createPreset("pro", "right", 110, 110, 125, 65, "none", "linen", null, "65%", {}, {
        title: "#2F3E36", subtitle: "#526756", coupleNames: "#526756", greeting: "#2F3E36", message: "#354F52", details: "#526756", colourOfDay: "#2F3E36", chips: "#FFFFFF", divider: "#526756"
      });

    case "/templates/template_pro_6.webp": // Starry Lavender Gold Dust - Align Center
      return createPreset("pro", "center", 125, 125, 60, 60, "0 0 8px rgba(255,255,255,0.7)", "starry", "dashed-gold", "80%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D8B76A", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 6px rgba(0,0,0,0.6)" });

    case "/templates/template_pro_7.webp": // Classic Charcoal Gold Floral - Align Left (Floral on Right)
      return createPreset("pro", "left", 120, 120, 75, 120, "1px 1px 3px rgba(216, 183, 106, 0.6)", "charcoal-gold", null, "65%", {}, {
        title: "#D8B76A", subtitle: "#EADFC8", coupleNames: "#FFFFFF", greeting: "#FFF5E0", message: "#EADFC8", details: "#D8B76A", colourOfDay: "#D8B76A", chips: "#FFFFFF", divider: "#D8B76A"
      }, { textShadow: "0 0 6px rgba(0,0,0,0.7)" });

    default:
      return createPreset("free", "center", 80, 90, 35, 35, "none", "default", null, "85%");
  }
};

/**
 * Safe per-block font size caps (in em units).
 * Prevents text from growing too large and breaking the card layout.
 *   format: { preview: { min, max }, invite: { min, max } }
 */
const BLOCK_FONT_CAPS = {
  title: { preview: { min: 0.9, max: 1.55 }, invite: { min: 1.2, max: 2.4 } },
  subtitle: { preview: { min: 0.6, max: 0.95 }, invite: { min: 0.8, max: 1.55 } },
  coupleNames: { preview: { min: 1.1, max: 2.1 }, invite: { min: 1.4, max: 3.0 } },
  greeting: { preview: { min: 0.6, max: 0.95 }, invite: { min: 0.85, max: 1.85 } },
  message: { preview: { min: 0.55, max: 0.85 }, invite: { min: 0.75, max: 1.15 } },
  details: { preview: { min: 0.6, max: 0.9 }, invite: { min: 0.75, max: 1.1 } },
  reception: { preview: { min: 0.6, max: 0.9 }, invite: { min: 0.75, max: 1.1 } },
  colors: { preview: { min: 0.5, max: 0.72 }, invite: { min: 0.65, max: 0.95 } },
};

/**
 * Returns compiled inline styles for a block name, applying layoutConfig variables.
 * Accepts customTextSize to apply per-block clamped font scaling (never on parent wrapper).
 */
export const getBlockStyles = (
  blockName,
  layout,
  customTextAlign,
  userHasCustomAlignment,
  pageType,
  customTextColor,
  primaryTextColor,
  userHasCustomTextColor,
  customTextSize = 1.0,
  customTextColors = {}
) => {
  const layoutConfig = layout?.layoutConfig || {};
  const blockConfig = layoutConfig.blocks?.[blockName] || {};

  // Determine alignment
  const blockAlign = blockConfig.align || layout?.align || "center";
  const finalAlignment = userHasCustomAlignment ? (customTextAlign || "center") : blockAlign;
  const alignSelf = finalAlignment === "left" ? "flex-start" : finalAlignment === "right" ? "flex-end" : "center";

  // Helper to extract layoutConfig value
  const getVal = (prop, fallback) => {
    if (blockConfig[prop] === undefined) return fallback;
    if (typeof blockConfig[prop] === "object" && (blockConfig[prop].preview !== undefined || blockConfig[prop].invite !== undefined)) {
      return blockConfig[prop][pageType] !== undefined ? blockConfig[prop][pageType] : fallback;
    }
    return blockConfig[prop];
  };

  // Extract variables
  const mt = getVal("marginTop", undefined);
  const mb = getVal("marginBottom", undefined);
  const blockMaxWidth = getVal("maxWidth", undefined);
  const rawFontSize = getVal("fontSize", undefined);
  const lineHeight = getVal("lineHeight", undefined);
  const transform = getVal("transform", undefined);

  const contrast = layout?.contrastHelpers || {};
  let finalShadow = contrast.textShadow || "none";
  if (contrast.softGlow && contrast.softGlow !== "none") {
    finalShadow = finalShadow !== "none" ? `${finalShadow}, ${contrast.softGlow}` : contrast.softGlow;
  }

  // Construct styling block
  const styles = {
    textAlign: finalAlignment,
    alignSelf,
    textShadow: finalShadow,
    // Safe word breaking: prevent mid-word splits while allowing long words to wrap
    wordBreak: "normal",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
    width: "100%",
    maxWidth: "100%",
  };

  // Determine scale factor based on block name
  let scale = 1.0;
  if (typeof customTextSize === "object" && customTextSize !== null) {
    let lookupKey = blockName;
    if (blockName === "divider1" || blockName === "divider2") lookupKey = "details";
    scale = customTextSize[lookupKey] || customTextSize.global || 1.0;
  } else {
    scale = typeof customTextSize === "number" && customTextSize > 0 ? customTextSize : 1.0;
  }

  if (mt !== undefined) styles.marginTop = mt;
  if (mb !== undefined) styles.marginBottom = mb;
  if (blockMaxWidth !== undefined) {
    styles.maxWidth = (scale > 1.0) ? "100%" : blockMaxWidth;
  }

  // Apply per-block clamped font size with scale multiplier.
  // Using CSS clamp() ensures text stays within safe min/max regardless of slider position.
  if (rawFontSize !== undefined) {
    const baseEm = parseFloat(rawFontSize);
    const caps = BLOCK_FONT_CAPS[blockName]?.[pageType] || { min: baseEm * 0.7, max: baseEm * 1.4 };
    const scaledEm = Math.round(baseEm * scale * 1000) / 1000;
    // Relax the max cap to allow scaling to container limit as requested
    const maxCap = Math.max(caps.max * 2.5, 6.0);
    styles.fontSize = `clamp(${caps.min}em, ${scaledEm}em, ${maxCap}em)`;
  }

  if (lineHeight !== undefined) styles.lineHeight = lineHeight;
  if (transform !== undefined) styles.transform = transform;

  if (contrast.stroke && contrast.stroke !== "none") {
    styles.WebkitTextStroke = contrast.stroke;
  }

  let blockColorKey = blockName;
  if (blockName === "divider1" || blockName === "divider2") blockColorKey = "details";
  const sectionColor = customTextColors?.[blockColorKey];

  // Handle per-block, custom global, or template default text color.
  if (sectionColor) {
    styles.color = sectionColor;
  } else if (userHasCustomTextColor) {
    styles.color = customTextColor || primaryTextColor;
  } else {
    if (blockName === "reception") blockColorKey = "details";
    if (blockName === "colors") blockColorKey = "colourOfDay";
    if (blockName === "divider2" || blockName === "divider1") blockColorKey = "divider";

    styles.color = layout?.textColorConfig?.[blockColorKey] || layout?.textColorConfig?.message || primaryTextColor || customTextColor;
  }

  return styles;
};

export const PREMADE_TEMPLATES = [
  // Free Tier
  {
    tier: "free",
    name: "Blush Pink Watercolor",
    url: "/templates/Blush Pink Watercolor.webp",
    preview: "/templates/Blush Pink Watercolor.webp",
  },
  {
    tier: "free",
    name: "Cream Floral Elegance",
    url: "/templates/Cream Floral Elegance.webp",
    preview: "/templates/Cream Floral Elegance.webp",
  },
  {
    tier: "free",
    name: "Free Gallery Orchid Breeze",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_09 AM (1).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_09 AM (1).webp",
    onlyInGallery: true
  },
  {
    tier: "free",
    name: "Free Gallery Classic Laurel",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_10 AM (2).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_10 AM (2).webp",
    onlyInGallery: true
  },
  {
    tier: "free",
    name: "Free Gallery Spring Whimsy",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_14 AM (3).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_14 AM (3).webp",
    onlyInGallery: true
  },
  {
    tier: "free",
    name: "Free Gallery Eucalyptus Arch",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_16 AM (4).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_16 AM (4).webp",
    onlyInGallery: true
  },
  {
    tier: "free",
    name: "Free Gallery Peach Rose Border",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_19 AM (5).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_19 AM (5).webp",
    onlyInGallery: true
  },
  {
    tier: "free",
    name: "Free Gallery Pure Gold Accent",
    url: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_23 AM (6).webp",
    preview: "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_23 AM (6).webp",
    onlyInGallery: true
  },

  // Plus Tier
  {
    tier: "plus",
    name: "Classic Navy, Gold & Cream",
    url: "/templates/template_free_1.webp",
    preview: "/templates/template_free_1.webp",
  },
  {
    tier: "plus",
    name: "Golden Arch Minimalist",
    url: "/templates/template_plus_1.webp",
    preview: "/templates/template_plus_1.webp",
  },
  {
    tier: "plus",
    name: "Emerald Eucalyptus Frame",
    url: "/templates/Emerald Eucalyptus Frame.webp",
    preview: "/templates/Emerald Eucalyptus Frame.webp",
  },
  {
    tier: "plus",
    name: "Royal Navy Gold Frame",
    url: "/templates/elegant_gold_frame_with_navy_backdrop.webp",
    preview: "/templates/elegant_gold_frame_with_navy_backdrop.webp",
  },
  {
    tier: "plus",
    name: "Royal Navy Lace Accent",
    url: "/templates/Royal Navy Lace Accent.webp",
    preview: "/templates/Royal Navy Lace Accent.webp",
  },
  {
    tier: "plus",
    name: "Elegant Purple & Silver Floral",
    url: "/templates/Elegant purple and silver floral.webp",
    preview: "/templates/Elegant purple and silver floral.webp",
  },
  {
    tier: "plus",
    name: "Plus Gallery Vintage Damask",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (1).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (1).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Gilded Leaves",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (2).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (2).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Royal Arch",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (3).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (3).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Golden Geometry",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (4).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (4).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Midnight Orchids",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (5).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_23 PM (5).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Emerald Eucalyptus",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (6).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (6).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Velvet Romance",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (7).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (7).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Golden Dust Frame",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (8).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (8).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Classic Crest",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (9).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (9).webp",
    onlyInGallery: true
  },
  {
    tier: "plus",
    name: "Plus Gallery Ivory Ornaments",
    url: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (10).webp",
    preview: "/Plus Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_00_24 PM (10).webp",
    onlyInGallery: true
  },

  // Pro Tier
  {
    tier: "pro",
    name: "Luxe Marble Geometric",
    url: "/templates/template_pro_4.webp",
    preview: "/templates/template_pro_4.webp",
  },
  {
    tier: "pro",
    name: "Midnight Black Floral",
    url: "/templates/template_plus_3.webp",
    preview: "/templates/template_plus_3.webp",
  },
  {
    tier: "pro",
    name: "Deep Black Rose",
    url: "/templates/Midnight Black Floral2.webp",
    preview: "/templates/Midnight Black Floral2.webp",
  },
  {
    tier: "pro",
    name: "Dark Black Gold Marble",
    url: "/templates/Dark Black Gold Marble.webp",
    preview: "/templates/Dark Black Gold Marble.webp",
  },
  {
    tier: "pro",
    name: "Burgundy Velvet Filigree",
    url: "/templates/Burgundy Velvet Filigree.webp",
    preview: "/templates/Burgundy Velvet Filigree.webp",
  },
  {
    tier: "pro",
    name: "Royal Emerald Gold Frame",
    url: "/templates/Royal Emerald Gold Frame.webp",
    preview: "/templates/Royal Emerald Gold Frame.webp",
  },
  {
    tier: "pro",
    name: "Blush Pink & Rose Gold Glitter",
    url: "/templates/Blush Pink & Rose Gold Glitter.webp",
    preview: "/templates/Blush Pink & Rose Gold Glitter.webp",
  },
  {
    tier: "pro",
    name: "Minimalist Linen Ivory Leaves",
    url: "/templates/template_pro_5.webp",
    preview: "/templates/template_pro_5.webp",
  },
  {
    tier: "pro",
    name: "Starry Lavender Gold Dust",
    url: "/templates/template_pro_6.webp",
    preview: "/templates/template_pro_6.webp",
  },
  {
    tier: "pro",
    name: "Classic Charcoal Gold Floral",
    url: "/templates/template_pro_7.webp",
    preview: "/templates/template_pro_7.webp",
  },
  {
    tier: "pro",
    name: "Pro Gallery Celestial Shimmer",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_17 PM (1).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_17 PM (1).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Royal Purple Filigree",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_18 PM (2).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_18 PM (2).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Lux Emerald Marble",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_18 PM (3).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_18 PM (3).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Platinum Shimmer",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_19 PM (4).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_19 PM (4).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Gilded Onyx Frame",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_19 PM (5).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_19 PM (5).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Classic Burgundy Velvet",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_20 PM (6).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_20 PM (6).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Royal Blue Lace",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_21 PM (7).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_21 PM (7).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Peach Rose Garden",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_22 PM (8).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_22 PM (8).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Minimalist Linen Frame",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_25 PM (9).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_25 PM (9).webp",
    onlyInGallery: true
  },
  {
    tier: "pro",
    name: "Pro Gallery Golden Sparkle Frame",
    url: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_34 PM (10).webp",
    preview: "/Pro Plans Vowlink/ChatGPT Image Jun 25, 2026, 01_11_34 PM (10).webp",
    onlyInGallery: true
  },
];
