import type { LucideIcon } from "lucide-react";
import {
  Antenna,
  Award,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  Building2,
  CircleDollarSign,
  Clock,
  Cloud,
  CreditCard,
  Crown,
  Database,
  Download,
  Flame,
  Gem,
  Gift,
  Globe2,
  Handshake,
  Headphones,
  Heart,
  Laptop,
  Tablet,
  MapPin,
  Medal,
  Megaphone,
  MessageCircle,
  Package,
  Radio,
  Repeat,
  Rocket,
  Router,
  Satellite,
  Send,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Signal,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tag,
  Target,
  Timer,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";

export type VendorStoreIconCategory = "commerce" | "mobile" | "brand" | "growth";

export const VENDOR_STORE_ICON_IDS = [
  "store",
  "shopping-bag",
  "shopping-cart",
  "package",
  "gift",
  "tag",
  "wallet",
  "banknote",
  "credit-card",
  "circle-dollar",
  "smartphone",
  "tablet",
  "laptop",
  "signal",
  "wifi",
  "antenna",
  "satellite",
  "router",
  "database",
  "cloud",
  "download",
  "zap",
  "crown",
  "sparkles",
  "gem",
  "award",
  "medal",
  "star",
  "shield",
  "badge-check",
  "trending",
  "rocket",
  "bar-chart",
  "target",
  "megaphone",
  "globe",
  "users",
  "handshake",
  "flame",
  "clock",
  "timer",
  "repeat",
  "heart",
  "headphones",
  "message",
  "send",
  "radio",
  "bot",
  "building",
  "map-pin",
  "truck",
] as const;

export type VendorStoreIconId = (typeof VENDOR_STORE_ICON_IDS)[number];

export const DEFAULT_VENDOR_STORE_ICON: VendorStoreIconId = "store";

export const VENDOR_STORE_ICON_CATEGORIES: {
  id: VendorStoreIconCategory | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "commerce", label: "Commerce" },
  { id: "mobile", label: "Mobile & data" },
  { id: "brand", label: "Brand" },
  { id: "growth", label: "Growth" },
];

/** Legacy emoji values saved before icon IDs */
const LEGACY_EMOJI_TO_ICON: Record<string, VendorStoreIconId> = {
  "🛍️": "store",
  "🚀": "rocket",
  "⚡": "zap",
  "💎": "gem",
  "🔥": "flame",
  "🎯": "target",
  "🌟": "sparkles",
  "📡": "signal",
  "🎁": "gift",
  "💰": "wallet",
  "📱": "smartphone",
  "🏪": "store",
};

export const VENDOR_STORE_ICONS: {
  id: VendorStoreIconId;
  label: string;
  category: VendorStoreIconCategory;
  icon: LucideIcon;
}[] = [
  { id: "store", label: "Storefront", category: "commerce", icon: Store },
  { id: "shopping-bag", label: "Retail", category: "commerce", icon: ShoppingBag },
  { id: "shopping-cart", label: "Cart", category: "commerce", icon: ShoppingCart },
  { id: "package", label: "Bundles", category: "commerce", icon: Package },
  { id: "gift", label: "Gifts", category: "commerce", icon: Gift },
  { id: "tag", label: "Deals", category: "commerce", icon: Tag },
  { id: "wallet", label: "Wallet", category: "commerce", icon: Wallet },
  { id: "banknote", label: "Cash", category: "commerce", icon: Banknote },
  { id: "credit-card", label: "Card pay", category: "commerce", icon: CreditCard },
  { id: "circle-dollar", label: "Savings", category: "commerce", icon: CircleDollarSign },

  { id: "smartphone", label: "Mobile", category: "mobile", icon: Smartphone },
  { id: "tablet", label: "Tablet", category: "mobile", icon: Tablet },
  { id: "laptop", label: "Devices", category: "mobile", icon: Laptop },
  { id: "signal", label: "Data", category: "mobile", icon: Signal },
  { id: "wifi", label: "Wi‑Fi", category: "mobile", icon: Wifi },
  { id: "antenna", label: "Network", category: "mobile", icon: Antenna },
  { id: "satellite", label: "Coverage", category: "mobile", icon: Satellite },
  { id: "router", label: "Hotspot", category: "mobile", icon: Router },
  { id: "database", label: "Data hub", category: "mobile", icon: Database },
  { id: "cloud", label: "Cloud", category: "mobile", icon: Cloud },
  { id: "download", label: "Top-up", category: "mobile", icon: Download },

  { id: "zap", label: "Instant", category: "brand", icon: Zap },
  { id: "crown", label: "Elite", category: "brand", icon: Crown },
  { id: "sparkles", label: "Premium", category: "brand", icon: Sparkles },
  { id: "gem", label: "VIP", category: "brand", icon: Gem },
  { id: "award", label: "Award", category: "brand", icon: Award },
  { id: "medal", label: "Top rated", category: "brand", icon: Medal },
  { id: "star", label: "Star", category: "brand", icon: Star },
  { id: "shield", label: "Trusted", category: "brand", icon: Shield },
  { id: "badge-check", label: "Verified", category: "brand", icon: BadgeCheck },

  { id: "trending", label: "Growth", category: "growth", icon: TrendingUp },
  { id: "rocket", label: "Launch", category: "growth", icon: Rocket },
  { id: "bar-chart", label: "Analytics", category: "growth", icon: BarChart3 },
  { id: "target", label: "Goals", category: "growth", icon: Target },
  { id: "megaphone", label: "Promo", category: "growth", icon: Megaphone },
  { id: "globe", label: "Nationwide", category: "growth", icon: Globe2 },
  { id: "users", label: "Community", category: "growth", icon: Users },
  { id: "handshake", label: "Partner", category: "growth", icon: Handshake },
  { id: "flame", label: "Hot deals", category: "growth", icon: Flame },
  { id: "clock", label: "Fast", category: "growth", icon: Clock },
  { id: "timer", label: "Quick", category: "growth", icon: Timer },
  { id: "repeat", label: "Repeat", category: "growth", icon: Repeat },
  { id: "heart", label: "Loyalty", category: "growth", icon: Heart },
  { id: "headphones", label: "Support", category: "growth", icon: Headphones },
  { id: "message", label: "Chat", category: "growth", icon: MessageCircle },
  { id: "send", label: "Send", category: "growth", icon: Send },
  { id: "radio", label: "Broadcast", category: "growth", icon: Radio },
  { id: "bot", label: "Auto", category: "growth", icon: Bot },
  { id: "building", label: "Business", category: "growth", icon: Building2 },
  { id: "map-pin", label: "Local", category: "growth", icon: MapPin },
  { id: "truck", label: "Delivery", category: "growth", icon: Truck },
];

const ICON_MAP = Object.fromEntries(VENDOR_STORE_ICONS.map((e) => [e.id, e])) as Record<
  VendorStoreIconId,
  (typeof VENDOR_STORE_ICONS)[number]
>;

const ICON_ID_SET = new Set<string>(VENDOR_STORE_ICON_IDS);

export function normalizeVendorStoreIcon(value?: string | null): VendorStoreIconId {
  if (!value) return DEFAULT_VENDOR_STORE_ICON;
  if (ICON_ID_SET.has(value)) return value as VendorStoreIconId;
  if (value in LEGACY_EMOJI_TO_ICON) return LEGACY_EMOJI_TO_ICON[value];
  return DEFAULT_VENDOR_STORE_ICON;
}

export function getVendorStoreIcon(value?: string | null) {
  const id = normalizeVendorStoreIcon(value);
  return ICON_MAP[id];
}

export function resolveVendorStoreIconComponent(value?: string | null): LucideIcon {
  const id = normalizeVendorStoreIcon(value);
  return ICON_MAP[id]?.icon ?? Store;
}

export function filterVendorStoreIcons(
  query: string,
  category: VendorStoreIconCategory | "all",
): typeof VENDOR_STORE_ICONS {
  const q = query.trim().toLowerCase();
  return VENDOR_STORE_ICONS.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return item.id.includes(q) || item.label.toLowerCase().includes(q);
  });
}
