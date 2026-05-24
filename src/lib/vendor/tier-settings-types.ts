import type { VendorTier } from "@/types";

export interface TierPromotionThresholds {
  minFulfilledOrders: number;
  minSuccessRate: number;
  minDailyOrders: number;
}

export interface AgentTierPricing {
  label: string;
  description: string;
  commissionRate: number;
  rewardRate: number;
  minWithdrawal: number;
}

export interface AgentTierSettings {
  tiers: Record<VendorTier, AgentTierPricing>;
  promotion: {
    verified: TierPromotionThresholds;
    pro: TierPromotionThresholds;
  };
}

export const AGENT_TIER_SETTINGS_KEY = "agent_tier_rules";
