import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVendorStoreIconComponent } from "@/lib/vendor-store-icons";
import { resolveThemeAccent } from "@/lib/vendor-theme";

interface AvatarProps {
  name: string;
  themeColor?: string;
  emoji?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  verified?: boolean;
  className?: string;
}

const SIZES = {
  xs: { box: "h-6 w-6", text: "text-[9px]", icon: 12, verifyOffset: "-bottom-0.5 -right-0.5", verifySize: "h-3 w-3" },
  sm: { box: "h-8 w-8", text: "text-[10px]", icon: 14, verifyOffset: "-bottom-0.5 -right-0.5", verifySize: "h-3.5 w-3.5" },
  md: { box: "h-10 w-10", text: "text-xs", icon: 18, verifyOffset: "-bottom-1 -right-1", verifySize: "h-4 w-4" },
  lg: { box: "h-14 w-14", text: "text-base", icon: 22, verifyOffset: "-bottom-1 -right-1", verifySize: "h-5 w-5" },
  xl: { box: "h-20 w-20", text: "text-lg", icon: 28, verifyOffset: "-bottom-1 -right-1", verifySize: "h-6 w-6" },
} as const;

function initialsOf(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tone(seed: string, override?: string): { from: string; to: string } {
  if (override) {
    return { from: override, to: shade(override, -18) };
  }
  const palettes = [
    { from: "#06b6d4", to: "#0891b2" }, // cyan
    { from: "#0ea5e9", to: "#0369a1" }, // sky
    { from: "#3b82f6", to: "#1d4ed8" }, // blue
    { from: "#8b5cf6", to: "#6d28d9" }, // violet
    { from: "#ec4899", to: "#be185d" }, // pink
    { from: "#f59e0b", to: "#b45309" }, // amber
    { from: "#10b981", to: "#047857" }, // emerald
    { from: "#14b8a6", to: "#0f766e" }, // teal
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

function shade(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0xff) + amount;
  let b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function Avatar({
  name,
  themeColor,
  emoji,
  size = "md",
  verified,
  className,
}: AvatarProps) {
  const initials = initialsOf(name);
  const t = tone(name, resolveThemeAccent(themeColor));
  const dim = SIZES[size];
  const hasIcon = Boolean(emoji);
  const Icon = hasIcon ? resolveVendorStoreIconComponent(emoji) : null;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold text-white",
          dim.box,
          !hasIcon && dim.text,
        )}
        style={{
          background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
          letterSpacing: hasIcon ? undefined : "-0.02em",
        }}
        aria-hidden
      >
        {Icon ? (
          <Icon size={dim.icon} strokeWidth={2} className="text-white" />
        ) : (
          initials
        )}
      </span>
      {verified && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-white text-cyan-500 ring-2 ring-white",
            dim.verifyOffset,
            dim.verifySize,
          )}
        >
          <BadgeCheck
            className="h-full w-full"
            strokeWidth={2.5}
            style={{ fill: "white", color: "#06b6d4" }}
          />
        </span>
      )}
    </span>
  );
}
