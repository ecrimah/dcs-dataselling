export { BRAND, BRAND_GRADIENT } from "@/lib/brand";

export const SITE = {
  name: "DCS ELITE",
  shortName: "DCS",
  brandLine: "ELITE",
  domain: "dcselite.com",
  tagline: "Ghana's Elite Data Platform",
  description:
    "Launch your own data store on dcselite.com — private storefronts, secure MoMo payments, and instant fulfilment for MTN, Telecel & AirtelTigo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dcselite.com",
  supportWhatsApp: "+233200000000",
  supportEmail: "support@dcselite.com",
  logo: "/brand/dcs-elite-logo.png",
  ogImage: "/og.png",
} as const;

export const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", textColor: "#1a1a1a" },
  { id: "telecel", name: "Telecel", color: "#E4002B", textColor: "#ffffff" },
  { id: "at", name: "AT (AirtelTigo)", color: "#E30613", textColor: "#ffffff" },
] as const;

export type NetworkId = (typeof NETWORKS)[number]["id"];

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "queued",
  "processing",
  "fulfilled",
  "failed",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SORT_OPTIONS = [
  { id: "best_value", label: "Best Value" },
  { id: "fastest", label: "Fastest Fulfilment" },
  { id: "lowest_price", label: "Lowest Price" },
  { id: "popular", label: "Most Popular" },
] as const;

export const PAYMENT_PROVIDERS = ["paystack", "moolre"] as const;

/** One-time fee (GHS) vendors pay before store onboarding is submitted */
export const VENDOR_STORE_SETUP_FEE_GHS = Number(
  process.env.VENDOR_STORE_SETUP_FEE_GHS ?? process.env.NEXT_PUBLIC_VENDOR_STORE_SETUP_FEE_GHS ?? 50,
);
