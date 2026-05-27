import { VENDOR_STORE_SETUP_FEE_GHS } from "@/lib/constants";

/** Key used in the `platform_settings` table for the JSON blob below. */
export const PLATFORM_CONFIG_KEY = "platform_config";

export interface PlatformConfig {
  /** One-time fee (GHS) every new agent pays before their store goes live. */
  vendorSetupFeeGhs: number;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  vendorSetupFeeGhs:
    Number.isFinite(VENDOR_STORE_SETUP_FEE_GHS) && VENDOR_STORE_SETUP_FEE_GHS > 0
      ? VENDOR_STORE_SETUP_FEE_GHS
      : 50,
};

export function normalizePlatformConfig(input: unknown): PlatformConfig {
  const base = DEFAULT_PLATFORM_CONFIG;
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<PlatformConfig>;

  return {
    vendorSetupFeeGhs: clampNum(raw.vendorSetupFeeGhs, base.vendorSetupFeeGhs, 1, 100000),
  };
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}
