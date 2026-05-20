/** DCS ELITE brand palette — single source of truth */
export const BRAND = {
  royalBlue: "#0A2E5D",
  metallicGold: "#D4AF37",
  deepNavy: "#081F3F",
  softWhite: "#F5F5F5",
  eliteBlack: "#111111",
  goldGlow: "#F4D160",
  goldDark: "#8B7320",
  royalMid: "#0d3a6e",
} as const;

export const BRAND_GRADIENT = {
  background: `linear-gradient(135deg, ${BRAND.deepNavy} 0%, ${BRAND.royalBlue} 100%)`,
  goldButton: `linear-gradient(135deg, ${BRAND.metallicGold} 0%, ${BRAND.goldGlow} 100%)`,
  goldText: `linear-gradient(120deg, ${BRAND.goldGlow} 0%, ${BRAND.metallicGold} 50%, ${BRAND.goldGlow} 100%)`,
} as const;
