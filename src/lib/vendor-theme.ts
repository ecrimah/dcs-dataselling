/** Solid brand colours and CSS gradients stored in vendors.theme_color */

export const DEFAULT_VENDOR_THEME = "#06b6d4";

export const VENDOR_THEME_SOLIDS = [
  { id: "#06b6d4", name: "Cyan" },
  { id: "#0ea5e9", name: "Sky" },
  { id: "#3b82f6", name: "Blue" },
  { id: "#8b5cf6", name: "Violet" },
  { id: "#ec4899", name: "Pink" },
  { id: "#f59e0b", name: "Amber" },
  { id: "#10b981", name: "Emerald" },
  { id: "#14b8a6", name: "Teal" },
] as const;

export const VENDOR_THEME_GRADIENTS = [
  { id: "grad-ocean", name: "Ocean", css: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" },
  { id: "grad-aurora", name: "Aurora", css: "linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%)" },
  { id: "grad-elite", name: "Elite", css: "linear-gradient(135deg, #0f172a 0%, #06b6d4 100%)" },
  { id: "grad-sunset", name: "Sunset", css: "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)" },
  { id: "grad-royal", name: "Royal", css: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" },
  { id: "grad-forest", name: "Forest", css: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" },
  { id: "grad-fire", name: "Fire", css: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" },
  { id: "grad-midnight", name: "Midnight", css: "linear-gradient(135deg, #1e293b 0%, #2563eb 100%)" },
  { id: "grad-rose", name: "Rose", css: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)" },
  { id: "grad-mint", name: "Mint", css: "linear-gradient(135deg, #2dd4bf 0%, #4ade80 100%)" },
  { id: "grad-electric", name: "Electric", css: "linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)" },
  { id: "grad-premium", name: "Premium", css: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" },
] as const;

const GRADIENT_BY_CSS = new Map<string, (typeof VENDOR_THEME_GRADIENTS)[number]>(
  VENDOR_THEME_GRADIENTS.map((g) => [g.css, g]),
);

export function isThemeGradient(value?: string | null): boolean {
  if (!value) return false;
  return value.trim().startsWith("linear-gradient");
}

export function buildCustomGradient(from: string, to: string, angle = 135): string {
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}

/** Full CSS background for banners, cards, previews */
export function resolveThemeBackground(value?: string | null): string {
  if (!value) return DEFAULT_VENDOR_THEME;
  if (isThemeGradient(value)) return value;
  return `linear-gradient(135deg, ${value} 0%, ${shadeHex(value, -18)} 100%)`;
}

/** Single hex for accents, rings, and avatar fallback when a gradient is set */
export function resolveThemeAccent(value?: string | null): string {
  if (!value) return DEFAULT_VENDOR_THEME;
  if (!isThemeGradient(value)) return value;
  const match = value.match(/#[0-9a-fA-F]{3,8}/);
  return match?.[0] ?? DEFAULT_VENDOR_THEME;
}

export function getGradientPreset(value?: string | null) {
  if (!value || !isThemeGradient(value)) return null;
  return GRADIENT_BY_CSS.get(value) ?? null;
}

export function parseCustomGradient(value?: string | null): { from: string; to: string } | null {
  if (!value || !isThemeGradient(value)) return null;
  const colors = value.match(/#[0-9a-fA-F]{6}/g);
  if (!colors || colors.length < 2) return null;
  return { from: colors[0], to: colors[1] };
}

function shadeHex(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const num = parseInt(c, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0xff) + amount;
  let b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
