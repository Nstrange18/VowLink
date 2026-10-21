import { isHexColor } from "../components/ColorPicker";

export const isDarkColor = (hex) => {
  if (!hex || hex === "#999") return false;
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 120;
};

export const getLuminance = (hex) => {
  if (!hex || !isHexColor(hex)) return 0;
  const clean = hex.replace("#", "");
  const values = [0, 2, 4].map((start) => {
    const channel = parseInt(clean.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};

export const getContrastRatio = (a, b) => {
  const l1 = getLuminance(a);
  const l2 = getLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};

export const getReadableTextColor = (background, preferred, fallbackDark = "#070A13", fallbackLight = "#F5EBD6") => {
  if (isHexColor(background) && isHexColor(preferred) && getContrastRatio(background, preferred) >= 4.5) {
    return preferred;
  }

  if (!isHexColor(background)) {
    return fallbackLight;
  }

  return getContrastRatio(background, fallbackDark) >= getContrastRatio(background, fallbackLight)
    ? fallbackDark
    : fallbackLight;
};

export const resolveWeddingColors = (colors, defaultColorsList) => {
  const colorMap = {};
  defaultColorsList.forEach((c) => {
    colorMap[c.name.toLowerCase()] = c.hex;
  });

  const hexList = (colors || [])
    .map((name) => {
      if (isHexColor(name)) return name.toUpperCase();
      return colorMap[String(name).toLowerCase()];
    })
    .filter(Boolean);

  const primary = hexList[0] || "#1A2E4A"; // Default Navy

  const secondary =
    hexList[1] ||
    (hexList[0] && !isDarkColor(hexList[0]) ? hexList[0] : "#C9A84C");
  const tertiary = hexList[2] || secondary;

  const lightColors = [
    "ivory",
    "white",
    "cream",
    "nude",
    "blush pink",
    "peach",
    "mint green",
    "champagne gold",
  ];
  const selectedBgColorName = (colors || []).find(
    (name) =>
      !isHexColor(name) && lightColors.includes(String(name).toLowerCase()),
  );
  const selectedBgHex = selectedBgColorName
    ? colorMap[String(selectedBgColorName).toLowerCase()]
    : null;

  return { primary, secondary, tertiary, selectedBgHex };
};
