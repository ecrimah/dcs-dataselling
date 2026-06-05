import { VENDOR_STORE_SETUP_FEE_GHS } from "@/lib/constants";
import type { NetworkId } from "@/lib/constants";

/** Key used in the `platform_settings` table for the JSON blob below. */
export const PLATFORM_CONFIG_KEY = "platform_config";

export interface MomoDirectConfig {
  /** Master switch — when false the checkout shows Paystack only. */
  enabled: boolean;
  /** Merchant MoMo numbers per network. Empty string = disabled for that network. */
  merchantNumbers: Record<NetworkId, string>;
  /** Display name shown on the payment instructions card. */
  merchantName: string;
  /**
   * Shared secret the Forward-SMS Android app must send in the Authorization
   * header to POST /api/webhooks/momo-sms. Rotate at any time.
   */
  smsForwarderSecret: string;
}

/** Automated or manual supplier module for a network. */
export type NetworkSupplierId = "manual" | "skanka5" | "successbizhub";

export interface SupplierRoutingConfig {
  /** Per-network admin override. When omitted, follows SUPPLIER_FOR_<NETWORK> env. */
  mtn?: NetworkSupplierId;
  telecel?: NetworkSupplierId;
  at?: NetworkSupplierId;
}

export interface PlatformConfig {
  /** One-time fee (GHS) every new agent pays before their store goes live. */
  vendorSetupFeeGhs: number;
  /**
   * Block repeat orders to the same beneficiary within this window (minutes).
   * Admin range: 1–3.
   */
  recipientOrderCooldownMinutes: number;
  /** Reward (GHS) credited to referrer when an invited agent completes their first sale. */
  referralRewardGhs: number;
  /** SMS-forwarder-based direct MoMo payment settings. */
  momoDirect: MomoDirectConfig;
  /** Per-network supplier overrides (admin-controlled without env redeploy). */
  supplierRouting: SupplierRoutingConfig;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  vendorSetupFeeGhs:
    Number.isFinite(VENDOR_STORE_SETUP_FEE_GHS) && VENDOR_STORE_SETUP_FEE_GHS > 0
      ? VENDOR_STORE_SETUP_FEE_GHS
      : 50,
  recipientOrderCooldownMinutes: 3,
  referralRewardGhs: 10,
  momoDirect: {
    enabled: false,
    merchantNumbers: { mtn: "", telecel: "", at: "" },
    merchantName: "",
    smsForwarderSecret: "",
  },
  supplierRouting: {},
};

export function normalizePlatformConfig(input: unknown): PlatformConfig {
  const base = DEFAULT_PLATFORM_CONFIG;
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<PlatformConfig>;

  return {
    vendorSetupFeeGhs: clampNum(raw.vendorSetupFeeGhs, base.vendorSetupFeeGhs, 1, 100000),
    recipientOrderCooldownMinutes: clampInt(
      raw.recipientOrderCooldownMinutes,
      base.recipientOrderCooldownMinutes,
      1,
      3,
    ),
    referralRewardGhs: clampNum(raw.referralRewardGhs, base.referralRewardGhs, 1, 10000),
    momoDirect: normalizeMomoDirect(raw.momoDirect, base.momoDirect),
    supplierRouting: normalizeSupplierRouting(raw.supplierRouting, base.supplierRouting),
  };
}

const VALID_SUPPLIER_IDS = new Set<NetworkSupplierId>(["manual", "skanka5", "successbizhub"]);

function normalizeNetworkSupplierId(value: unknown): NetworkSupplierId | undefined {
  return typeof value === "string" && VALID_SUPPLIER_IDS.has(value as NetworkSupplierId)
    ? (value as NetworkSupplierId)
    : undefined;
}

function normalizeSupplierRouting(
  input: Partial<SupplierRoutingConfig> | undefined,
  fallback: SupplierRoutingConfig,
): SupplierRoutingConfig {
  if (!input || typeof input !== "object") return fallback;
  const out: SupplierRoutingConfig = {};
  const mtn = normalizeNetworkSupplierId(input.mtn) ?? fallback.mtn;
  const telecel = normalizeNetworkSupplierId(input.telecel) ?? fallback.telecel;
  const at = normalizeNetworkSupplierId(input.at) ?? fallback.at;
  if (mtn) out.mtn = mtn;
  if (telecel) out.telecel = telecel;
  if (at) out.at = at;
  return out;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalizeMomoDirect(
  input: Partial<MomoDirectConfig> | undefined,
  fallback: MomoDirectConfig,
): MomoDirectConfig {
  if (!input || typeof input !== "object") return fallback;

  const inputNumbers = (input.merchantNumbers ?? {}) as Partial<Record<NetworkId, string>>;
  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : fallback.enabled,
    merchantNumbers: {
      mtn: normalizeMomoNumber(inputNumbers.mtn, fallback.merchantNumbers.mtn),
      telecel: normalizeMomoNumber(inputNumbers.telecel, fallback.merchantNumbers.telecel),
      at: normalizeMomoNumber(inputNumbers.at, fallback.merchantNumbers.at),
    },
    merchantName: typeof input.merchantName === "string"
      ? input.merchantName.trim().slice(0, 80)
      : fallback.merchantName,
    smsForwarderSecret: typeof input.smsForwarderSecret === "string"
      ? input.smsForwarderSecret.trim().slice(0, 200)
      : fallback.smsForwarderSecret,
  };
}

function normalizeMomoNumber(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits.slice(-10);
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}
