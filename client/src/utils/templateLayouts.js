/**
 * Returns the layout configuration (paddings, alignments, shadows, and borders)
 * for each template to prevent invitation text from overlapping with background
 * illustrations or frames, and to give each card design a premium distinct vibe.
 * 
 * Users can still override alignment and offsets using manual settings.
 */
export const getTemplateLayout = (theme, customCardBg) => {
  if (theme !== "custom" || !customCardBg) {
    // Fallbacks for built-in styling themes (floral, minimalist, navy, stardust, forest)
    switch (theme) {
      case "floral":
        return { pt: 80, pb: 90, pl: 40, pr: 40, align: "center", textShadow: "none", dividerType: "floral" };
      case "minimalist":
        return { pt: 80, pb: 90, pl: 40, pr: 40, align: "center", textShadow: "none", dividerType: "minimalist", frameBorder: "minimalist" };
      case "navy":
        return { pt: 85, pb: 95, pl: 45, pr: 45, align: "center", textShadow: "0 0 6px rgba(201, 168, 76, 0.4)", dividerType: "gold", frameBorder: "gold" };
      case "stardust":
        return { pt: 80, pb: 90, pl: 40, pr: 40, align: "center", textShadow: "0 0 10px rgba(255,255,255,0.6)", dividerType: "stardust" };
      case "forest":
        return { pt: 80, pb: 90, pl: 40, pr: 40, align: "center", textShadow: "0 0 8px rgba(245, 214, 143, 0.5)", dividerType: "forest" };
      default:
        return { pt: 80, pb: 90, pl: 35, pr: 35, align: "center", textShadow: "none", dividerType: "default" };
    }
  }

  // Layout parameters for premium pre-made background designs
  switch (customCardBg) {
    case "/templates/template_free_1.png": // Classic Navy, Gold & Cream (Don't change layout)
      return { 
        pt: 95, pb: 95, pl: 50, pr: 50, 
        align: "center", 
        textShadow: "none", 
        dividerType: "default" 
      };
      
    case "/templates/template_free_2.png": // Blush Pink Watercolor - Align Left (Graphics on Right)
      return { 
        pt: 120, pb: 120, pl: 70, pr: 120, 
        align: "left", 
        textShadow: "1px 1px 3px rgba(140, 113, 90, 0.15)", 
        dividerType: "floral-rose" 
      };
      
    case "/templates/template_free_3.png": // Cream Floral Elegance - Align Right (Graphics on Left)
      return { 
        pt: 115, pb: 115, pl: 120, pr: 70, 
        align: "right", 
        textShadow: "none", 
        dividerType: "leaf-right" 
      };
      
    case "/templates/template_plus_1.png": // Emerald Eucalyptus Frame - Center Inside Leafy Borders (Centered Frame)
      return { 
        pt: 140, pb: 140, pl: 60, pr: 60, 
        align: "center", 
        textShadow: "0 1px 4px rgba(0,0,0,0.1)", 
        dividerType: "eucalyptus",
        frameBorder: "eucalyptus" 
      };
      
    case "/templates/template_plus_2.png": // Royal Navy Lace Accent - Align Right (Lace on Left)
      return { 
        pt: 100, pb: 100, pl: 125, pr: 60, 
        align: "right", 
        textShadow: "0 0 4px rgba(255,255,255,0.2)", 
        dividerType: "lace", 
        frameBorder: "lace" 
      };
      
    case "/templates/template_plus_3.png": // Midnight Black Floral (Don't change layout)
      return { 
        pt: 105, pb: 105, pl: 55, pr: 55, 
        align: "center", 
        textShadow: "none", 
        dividerType: "default" 
      };
      
    case "/templates/template_pro_1.png": // Dark Black Gold Marble - Align Left (Marble on Right)
      return { 
        pt: 110, pb: 110, pl: 75, pr: 120, 
        align: "left", 
        textShadow: "1px 1px 4px rgba(216, 183, 106, 0.7)", 
        dividerType: "gold-foil", 
        frameBorder: "dashed-gold" 
      };
      
    case "/templates/template_pro_2.png": // Burgundy Velvet Filigree - Align Right (Filigree on Left)
      return { 
        pt: 110, pb: 110, pl: 125, pr: 65, 
        align: "right", 
        textShadow: "1px 1px 3px rgba(216, 183, 106, 0.5)", 
        dividerType: "filigree", 
        frameBorder: "gold-thin" 
      };
      
    case "/templates/template_pro_3.png": // Royal Emerald Gold Frame - Center inside frame
      return { 
        pt: 145, pb: 145, pl: 70, pr: 70, 
        align: "center", 
        textShadow: "0 2px 5px rgba(216, 183, 106, 0.6)", 
        dividerType: "gold-royal", 
        frameBorder: "gold-royal" 
      };
      
    case "/templates/template_pro_4.png": // Blush Pink & Rose Gold Glitter - Align Left (Glitter on Right)
      return { 
        pt: 115, pb: 115, pl: 70, pr: 120, 
        align: "left", 
        textShadow: "1px 1px 3px rgba(184, 150, 58, 0.4)", 
        dividerType: "glitter" 
      };
      
    case "/templates/template_pro_5.png": // Minimalist Linen Ivory Leaves - Align Right (Leaves on Left)
      return { 
        pt: 110, pb: 110, pl: 115, pr: 65, 
        align: "right", 
        textShadow: "none", 
        dividerType: "linen" 
      };
      
    case "/templates/template_pro_6.png": // Starry Lavender Gold Dust - Align Center
      return { 
        pt: 125, pb: 125, pl: 60, pr: 60, 
        align: "center", 
        textShadow: "0 0 8px rgba(255,255,255,0.7)", 
        dividerType: "starry", 
        frameBorder: "dashed-gold" 
      };
      
    case "/templates/template_pro_7.png": // Classic Charcoal Gold Floral - Align Left (Floral on Right)
      return { 
        pt: 120, pb: 120, pl: 75, pr: 120, 
        align: "left", 
        textShadow: "1px 1px 3px rgba(216, 183, 106, 0.6)", 
        dividerType: "charcoal-gold" 
      };
      
    default:
      return { pt: 80, pb: 90, pl: 35, pr: 35, align: "center", textShadow: "none", dividerType: "default" };
  }
};
